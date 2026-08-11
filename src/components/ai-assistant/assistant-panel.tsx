"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Loader2, Mail, Receipt, Search, Send, ShoppingCart, Sparkles, WalletCards, CheckSquare2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendAssistantMessage, type ChatMessage, type AssistantAction } from "@/lib/actions/ai-assistant-actions";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { icon: ShoppingCart, label: "Create purchase order", prompt: "Mujhe PO banana hai. Jo details missing ho sirf wahi puchho, existing vendor/site master pehle check karna." },
  { icon: FileText, label: "Prepare quotation", prompt: "Mujhe quotation banana hai. Main Hindi/Hinglish me rough detail dunga; professional English me draft karke missing financial details puchhna." },
  { icon: Receipt, label: "Create invoice", prompt: "Mujhe invoice banana hai. Site/client billing profile check karke jo details missing ho wahi puchho." },
  { icon: Mail, label: "Draft professional email", prompt: "Mujhe ek professional English email draft karna hai. Main Hindi/Hinglish me purpose bataunga." },
  { icon: WalletCards, label: "Record expense / payment", prompt: "Mujhe ek expense/payment record karna hai. Amount, payee, business unit/site aur payment type missing ho to puchhna." },
  { icon: CheckSquare2, label: "Add today's work", prompt: "Aaj ke work me ek task add karna hai. Task detail puchho." },
  { icon: Search, label: "Find ERP record", prompt: "ERP me ye record/document dhundo: " },
];

export function AssistantPanel({ open, onOpenChange, initialPrompt = "" }: { open: boolean; onOpenChange: (v: boolean) => void; initialPrompt?: string }) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [actions, setActions] = React.useState<AssistantAction[]>([]);
  const [provider, setProvider] = React.useState("Cloudflare Workers AI · free daily quota");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length, loading]);
  React.useEffect(() => { if (open && initialPrompt) setInput(initialPrompt); }, [open, initialPrompt]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(next); setInput(""); setLoading(true);
    const result = await sendAssistantMessage(next);
    if (!result.ok) { setLoading(false); toast.error("Ratneswar AI", result.error); return; }
    setProvider(result.data.provider);
    setMessages(result.data.messages); setLoading(false);
    if (result.data.actionsTaken.length) { setActions((old) => [...old, ...result.data.actionsTaken]); router.refresh(); }
  }

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="flex w-full flex-col gap-0 border-l border-slate-200 bg-white p-0 sm:max-w-lg">
    <div className="border-b bg-gradient-to-r from-emerald-700 to-blue-700 px-5 py-5 text-white"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/10 p-2.5"><Sparkles className="h-5 w-5 text-emerald-100" /></div><div><p className="font-semibold">Ratneswar AI</p><p className="text-xs text-blue-100">Owner + Admin · {provider}</p></div></div></div>
    {actions.length > 0 && <div className="flex flex-wrap gap-2 border-b bg-slate-50 px-4 py-3">{actions.slice(-8).map((action, i) => <a key={`${action.tool}-${i}`} href={action.url} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">{action.label}<ExternalLink className="h-3 w-3" /></a>)}</div>}
    <div ref={scrollRef} className="flex-1 overflow-y-auto"><div className="space-y-4 p-4">{messages.length === 0 && <div><p className="mb-3 text-sm leading-6 text-slate-600">Hindi, Hinglish ya English me bolo. Financial details AI kabhi guess nahi karega.</p><div className="grid gap-2">{QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => <button key={label} onClick={() => setInput(prompt)} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/60"><span className="rounded-lg bg-blue-50 p-2 text-blue-700"><Icon className="h-4 w-4" /></span>{label}</button>)}</div></div>}
      {messages.map((message, index) => <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}><div className={cn("max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800")}>{message.content}</div></div>)}
      {loading && <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-800"><div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Ratneswar AI is working in the cloud…</div></div>}
    </div></div>
    <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="border-t bg-white p-3"><div className="flex items-center gap-2"><Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hindi / Hinglish / English me bolo…" disabled={loading} className="h-11" /><Button type="submit" size="icon" className="h-11 w-11 bg-gradient-to-br from-emerald-600 to-blue-600" disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button></div><p className="mt-2 text-center text-[10px] text-slate-400">Cloud AI · free daily quota · no office PC required</p></form>
  </SheetContent></Sheet>;
}
