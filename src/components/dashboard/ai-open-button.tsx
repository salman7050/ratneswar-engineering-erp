"use client";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
export function AiOpenButton() {
  return <Button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-ratneswar-ai"))} className="h-11 w-full justify-start bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500"><Sparkles className="h-4 w-4" /> Open Ratneswar AI</Button>;
}
