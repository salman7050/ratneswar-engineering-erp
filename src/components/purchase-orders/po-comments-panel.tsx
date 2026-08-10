"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addPOComment } from "@/lib/actions/purchase-order-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate } from "@/lib/utils";

interface CommentRow {
  id: string;
  content: string;
  createdAt: Date | string;
  user: { id: string; name: string };
}

export function POCommentsPanel({ poId, comments }: { poId: string; comments: CommentRow[] }) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const { run, loading } = useAction(addPOComment, {
    onSuccess: () => {
      setContent("");
      router.refresh();
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    run({ poId, content });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comments</p>
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
          <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No comments yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border/50 bg-secondary/15 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{c.user.name}</span>
                <span className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.content}</p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment…"
          rows={1}
          className="min-h-9 flex-1 text-xs"
        />
        <Button type="submit" size="sm" variant="glass" loading={loading} disabled={!content.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
