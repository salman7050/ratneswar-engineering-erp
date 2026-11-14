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
    // ERP pages are authenticated/live-data pages. Remove any previously
    // installed worker so network/runtime failures are never masked as offline.
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {
        // Non-fatal.
      });
      if ("caches" in window) {
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {
          // Non-fatal.
        });
      }
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
