"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { useUser } from "@/components/providers/supabase-provider";

const AssistantPanel = dynamic(
  () => import("@/components/ai-assistant/assistant-panel").then((m) => m.AssistantPanel),
  { ssr: false }
);

export function AssistantLauncher() {
  const user = useUser();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [initialPrompt, setInitialPrompt] = React.useState("");

  function handleOpen(prompt = "") {
    setInitialPrompt(prompt);
    setMounted(true);
    setOpen(true);
  }

  React.useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      handleOpen(detail?.prompt ?? "");
    };
    window.addEventListener("open-ratneswar-ai", listener);
    return () => window.removeEventListener("open-ratneswar-ai", listener);
  }, []);

  if (user?.role !== "ADMIN" && user?.role !== "OWNER") return null;

  return (
    <>
      <button
        onClick={() => handleOpen()}
        aria-label="Open AI Assistant"
        className="no-print fixed z-40 flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-[0_18px_36px_-16px_rgba(37,99,235,.72)] transition-transform hover:scale-105 active:scale-95 touch-target"
        style={{
          right: "max(1.5rem, env(safe-area-inset-right))",
          bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))",
        }}
      >
        <Sparkles className="h-5 w-5 text-white" />
      </button>
      {mounted && <AssistantPanel open={open} onOpenChange={setOpen} initialPrompt={initialPrompt} />}
    </>
  );
}
