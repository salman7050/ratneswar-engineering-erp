"use client";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
export function AiOpenButton() {
  return <Button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-ratneswar-ai"))} className="h-11 w-full justify-start bg-violet-700 hover:bg-violet-800"><Sparkles className="h-4 w-4" /> Open Ratneswar AI</Button>;
}
