"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, StickyNote } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { Button } from "@/components/ui/button";
import { createNote, updateNote, deleteNote } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";

interface NoteRow {
  id: string;
  content: string;
  updatedAt: Date | string;
}

export function QuickNotesPanel({ notes }: { notes: NoteRow[] }) {
  const router = useRouter();
  const { run: runCreate, loading: creating } = useAction(createNote, { onSuccess: () => router.refresh() });

  return (
    <MissionPanel
      title="Quick Notes"
      action={
        <Button size="sm" variant="glass" loading={creating} onClick={() => runCreate()}>
          <Plus className="h-4 w-4" /> Note
        </Button>
      }
    >
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <StickyNote className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No notes yet — jot down anything on your mind.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </MissionPanel>
  );
}

function NoteCard({ note }: { note: NoteRow }) {
  const router = useRouter();
  const [content, setContent] = React.useState(note.content);
  const [saved, setSaved] = React.useState(true);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { run: runUpdate } = useAction(updateNote);
  const { run: runDelete, loading: deleting } = useAction(deleteNote, { onSuccess: () => router.refresh() });

  function handleChange(value: string) {
    setContent(value);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await runUpdate({ id: note.id, content: value });
      setSaved(true);
    }, 800);
  }

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="group relative flex flex-col rounded-xl border border-white/10 bg-black/40 p-3 shadow-soft-md">
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Type a quick note…"
        rows={4}
        className="w-full resize-none border-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{saved ? "Saved" : "Saving…"}</span>
        <button
          onClick={() => runDelete(note.id)}
          disabled={deleting}
          aria-label="Delete note"
          className="touch-target flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
