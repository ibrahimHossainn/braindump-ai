// Markdown export and Web Share API helpers.
import type { Category, DumpEntry } from "@/hooks/useBrainDump";

const CATEGORY_LABELS: Record<Category, string> = {
  tasks: "Tasks",
  ideas: "Ideas",
  reminders: "Reminders",
  notes: "Notes",
};

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function entriesToMarkdown(entries: DumpEntry[]): string {
  const grouped: Record<Category, DumpEntry[]> = { tasks: [], ideas: [], reminders: [], notes: [] };
  for (const e of entries) grouped[e.category].push(e);

  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [];
  lines.push(`# BrainDump Export`);
  lines.push(``);
  lines.push(`*Exported on ${today} — ${entries.length} entries total*`);
  lines.push(``);

  (Object.keys(grouped) as Category[]).forEach((cat) => {
    const list = grouped[cat];
    if (list.length === 0) return;
    lines.push(`## ${CATEGORY_LABELS[cat]} (${list.length})`);
    lines.push(``);
    list
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach((e) => {
        const checkbox = cat === "tasks" ? (e.done ? "- [x] " : "- [ ] ") : "- ";
        lines.push(`${checkbox}${e.text}  \n  _${fmtDate(e.timestamp)}_`);
      });
    lines.push(``);
  });

  lines.push(`---`);
  lines.push(`*Made with BrainDump — voice-first AI capture.*`);
  return lines.join("\n");
}

export function downloadMarkdown(entries: DumpEntry[], filename = "braindump.md"): void {
  const md = entriesToMarkdown(entries);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function entryToShareText(entry: DumpEntry): string {
  return `${entry.text}\n\n— shared from BrainDump`;
}

/** Returns "shared" | "copied" | "failed". Falls back to clipboard when
 * Web Share is unavailable or the user cancels. */
export async function shareEntry(entry: DumpEntry): Promise<"shared" | "copied" | "failed"> {
  const text = entryToShareText(entry);
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

  if (typeof nav.share === "function") {
    try {
      await nav.share({ title: "BrainDump note", text });
      return "shared";
    } catch (err) {
      // User cancelled or share failed — try clipboard as a soft fallback.
      if ((err as DOMException)?.name === "AbortError") return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
