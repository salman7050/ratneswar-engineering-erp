import type { ChatMessage } from "@/lib/actions/ai-assistant-actions";

export interface DisplayTurn {
  role: "user" | "assistant";
  key: string;
  text: string;
  emailDrafts: { to?: string; subject: string; body: string }[];
}

export function toDisplayTurns(messages: ChatMessage[]): DisplayTurn[] {
  return messages.map((message, index) => ({ role: message.role, key: String(index), text: message.content.trim(), emailDrafts: [] })).filter((turn) => turn.text.length > 0);
}
