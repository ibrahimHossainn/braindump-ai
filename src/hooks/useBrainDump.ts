import { useState, useEffect, useCallback } from "react";

export type Category = "tasks" | "ideas" | "reminders" | "notes";

export interface DumpEntry {
  id: string;
  text: string;
  category: Category;
  timestamp: number;
  done?: boolean;
}

const STORAGE_KEY = "braindump-entries";

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  tasks: ["todo", "to do", "task", "need to", "have to", "must", "should", "finish", "complete", "do", "buy", "get", "make", "fix", "clean", "call", "send", "submit", "schedule"],
  reminders: ["remind", "remember", "don't forget", "appointment", "meeting", "deadline", "due", "alarm", "alert", "tomorrow", "tonight", "next week", "at ", "on monday", "on tuesday", "on wednesday", "on thursday", "on friday"],
  ideas: ["idea", "what if", "maybe", "could", "imagine", "concept", "thought", "how about", "wouldn't it be", "brainstorm", "proposal", "consider", "explore", "invent", "create"],
  notes: [],
};

function categorize(text: string): Category {
  const lower = text.toLowerCase();
  const scores: Record<Category, number> = { tasks: 0, ideas: 0, reminders: 0, notes: 0 };

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[cat as Category]++;
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? (best[0] as Category) : "notes";
}

function loadEntries(): DumpEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useBrainDump() {
  const [entries, setEntries] = useState<DumpEntry[]>(loadEntries);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback((text: string) => {
    if (!text.trim()) return;
    const entry: DumpEntry = {
      id: crypto.randomUUID(),
      text: text.trim(),
      category: categorize(text),
      timestamp: Date.now(),
    };
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleDone = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e))
    );
  }, []);

  const getByCategory = useCallback(
    (cat: Category) => entries.filter((e) => e.category === cat),
    [entries]
  );

  return { entries, addEntry, deleteEntry, toggleDone, getByCategory };
}
