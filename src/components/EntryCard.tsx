import { Check, Trash2, Clock } from "lucide-react";
import type { DumpEntry } from "@/hooks/useBrainDump";

interface EntryCardProps {
  entry: DumpEntry;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
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

const EntryCard = ({ entry, onDelete, onToggle }: EntryCardProps) => {
  return (
    <div className="glass-card-hover p-4 animate-fade-in group">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(entry.id)}
          className={`
            mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${entry.done
              ? "bg-neon-cyan/20 border-neon-cyan/50"
              : "border-muted-foreground/30 hover:border-neon-cyan/40"
            }
          `}
        >
          {entry.done && <Check className="w-3 h-3 text-neon-cyan" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed ${entry.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {entry.text}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="mono">{timeAgo(entry.timestamp)}</span>
          </div>
        </div>

        <button
          onClick={() => onDelete(entry.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg
            hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EntryCard;
