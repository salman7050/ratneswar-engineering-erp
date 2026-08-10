"use client";

import * as React from "react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const PwaContext = React.createContext<{
  isOnline: boolean;
  canInstall: boolean;
  promptInstall: () => void;
}>({
  isOnline: true,
  canInstall: false,
  promptInstall: () => {},
});

export function usePwa() {
  return React.useContext(PwaContext);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(true);
  const deferredPrompt = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = React.useState(false);

  React.useEffect(() => {
    // Register the service worker once, in production only, after first paint.
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const register = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Non-fatal — app still works without offline support.
        });
      };
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => {
      setIsOnline(true);
      toast.success("Back online");
    };
    const goOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline — live ERP data is unavailable");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = React.useCallback(() => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    deferredPrompt.current.userChoice.finally(() => {
      deferredPrompt.current = null;
      setCanInstall(false);
    });
  }, []);

  return (
    <PwaContext.Provider value={{ isOnline, canInstall, promptInstall }}>
      {children}
    </PwaContext.Provider>
  );
}
