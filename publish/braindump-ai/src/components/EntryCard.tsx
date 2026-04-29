import { useEffect, useRef, useState } from "react";
import { Check, Clock, Pencil, Share2, Sparkles, Trash2, X } from "lucide-react";
import type { DumpEntry } from "@/hooks/useBrainDump";

interface EntryCardProps {
  entry: DumpEntry;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onShare: (entry: DumpEntry) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function EntryCard({ entry, onDelete, onToggle, onEdit, onShare }: EntryCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.setSelectionRange(taRef.current.value.length, taRef.current.value.length);
    }
  }, [editing]);

  const beginEdit = () => {
    setDraft(entry.text);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(entry.text);
    setEditing(false);
  };

  const saveEdit = () => {
    const t = draft.trim();
    if (!t) {
      cancelEdit();
      return;
    }
    if (t !== entry.text) onEdit(entry.id, t);
    setEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <div className="glass-card-hover p-4 animate-fade-in group">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggle(entry.id)}
          aria-label={entry.done ? "Mark as not done" : "Mark as done"}
          className={`
            mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${entry.done
              ? "bg-neon-cyan/20 border-neon-cyan/50"
              : "border-zinc-500/30 hover:border-neon-cyan/40"
            }
          `}
        >
          {entry.done && <Check className="w-3 h-3 text-neon-cyan" />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={Math.min(8, Math.max(2, draft.split("\n").length))}
              className="w-full bg-zinc-900/60 border border-neon-cyan/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-cyan/60 resize-y"
            />
          ) : (
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                entry.done ? "line-through text-zinc-500" : "text-white"
              }`}
            >
              {entry.text}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span className="mono">{timeAgo(entry.timestamp)}</span>
            {entry.source === "ai" && (
              <span className="inline-flex items-center gap-1 text-neon-cyan/80 mono">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                aria-label="Save edit"
                className="p-1.5 rounded-lg hover:bg-neon-cyan/10 text-zinc-400 hover:text-neon-cyan transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="Cancel edit"
                className="p-1.5 rounded-lg hover:bg-zinc-700/40 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onShare(entry)}
                aria-label="Share entry"
                className="p-1.5 rounded-lg hover:bg-neon-purple/10 text-zinc-400 hover:text-neon-purple transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={beginEdit}
                aria-label="Edit entry"
                className="p-1.5 rounded-lg hover:bg-neon-cyan/10 text-zinc-400 hover:text-neon-cyan transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                aria-label="Delete entry"
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
