export const TODO_ASSIGNEE_MARKER = "[[RATNESWAR_TODO_ASSIGNEE:";

export function encodeTodoAssignee(description: string | null | undefined, assigneeName?: string | null) {
  const clean = stripTodoMeta(description ?? "");
  if (!assigneeName?.trim()) return clean || null;
  return `${clean}${clean ? "\n\n" : ""}${TODO_ASSIGNEE_MARKER}${encodeURIComponent(assigneeName.trim())}]]`;
}

export function parseTodoMeta(description: string | null | undefined) {
  const raw = description ?? "";
  const match = raw.match(/\[\[RATNESWAR_TODO_ASSIGNEE:([^\]]+)\]\]/);
  let assigneeName: string | null = null;
  if (match?.[1]) {
    try { assigneeName = decodeURIComponent(match[1]); } catch { assigneeName = match[1]; }
  }
  return { assigneeName, description: stripTodoMeta(raw) || null };
}

export function stripTodoMeta(value: string) {
  return value.replace(/\s*\[\[RATNESWAR_TODO_ASSIGNEE:[^\]]+\]\]\s*/g, "").trim();
}
