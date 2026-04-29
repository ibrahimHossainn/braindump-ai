import { useCallback, useEffect, useState } from "react";
import { classifyWithGrok, grokConfigured, localCategorize, type Category } from "@/lib/grok";

export type { Category } from "@/lib/grok";

export interface DumpEntry {
  id: string;
  text: string;
  category: Category;
  timestamp: number;
  done?: boolean;
  source?: "ai" | "local";
  confidence?: number;
}

const STORAGE_KEY = "braindump-entries-v2";
const LEGACY_KEY = "braindump-entries";

function loadEntries(): DumpEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as DumpEntry[]) : [];
  } catch {
    return [];
  }
}

export function useBrainDump() {
  const [entries, setEntries] = useState<DumpEntry[]>(loadEntries);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore quota errors
    }
  }, [entries]);

  /** Add an entry. If AI is configured, classify via the Edge proxy and
   * upgrade the entry's category once the response arrives. */
  const addEntry = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const id = crypto.randomUUID();
    const provisional: DumpEntry = {
      id,
      text: trimmed,
      category: localCategorize(trimmed),
      timestamp: Date.now(),
      source: "local",
      confidence: 0.4,
    };
    setEntries((prev) => [provisional, ...prev]);

    if (grokConfigured()) {
      classifyWithGrok(trimmed)
        .then((res) => {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === id
                ? { ...e, category: res.category, source: res.source, confidence: res.confidence }
                : e
            )
          );
        })
        .catch(() => {
          // already have local fallback, ignore
        });
    }
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleDone = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
  }, []);

  /** Edit an entry's text and re-classify it (AI if available, else local). */
  const editEntry = useCallback((id: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;

    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, text: trimmed, category: localCategorize(trimmed), source: "local", confidence: 0.4 }
          : e
      )
    );

    if (grokConfigured()) {
      classifyWithGrok(trimmed)
        .then((res) => {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === id
                ? { ...e, category: res.category, source: res.source, confidence: res.confidence }
                : e
            )
          );
        })
        .catch(() => {
          // ignore
        });
    }
  }, []);

  const getByCategory = useCallback(
    (cat: Category) => entries.filter((e) => e.category === cat),
    [entries]
  );

  const clearAll = useCallback(() => setEntries([]), []);

  return {
    entries,
    addEntry,
    deleteEntry,
    toggleDone,
    editEntry,
    getByCategory,
    clearAll,
  };
}
