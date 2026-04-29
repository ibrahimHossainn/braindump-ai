// Client-side wrapper around the /api/classify Edge function.
// In production (Vercel) the Edge function is always available, so AI is
// considered configured. In dev without Vercel, we fall through to the
// local keyword classifier.

export type Category = "tasks" | "ideas" | "reminders" | "notes";

export interface ClassifyResult {
  category: Category;
  confidence: number;
  source: "ai" | "local";
}

const ALLOWED: Category[] = ["tasks", "ideas", "reminders", "notes"];

const KW: Record<Category, string[]> = {
  tasks: [
    "todo", "to do", "to-do", "task", "need to", "have to", "gotta", "must",
    "should", "finish", "complete", "buy", "get", "pick up", "make", "fix",
    "clean", "call", "send", "submit", "schedule", "do the", "work on",
    "set up", "prepare", "organize", "arrange", "book", "order", "pay",
    "return", "deliver",
  ],
  reminders: [
    "remind", "reminder", "remember", "don't forget", "do not forget",
    "appointment", "meeting", "deadline", "due", "alarm", "alert",
    "tomorrow", "tonight", "next week", "next month", "at ", "by ",
    "on monday", "on tuesday", "on wednesday", "on thursday", "on friday",
    "on saturday", "on sunday", "in the morning", "in the evening",
    "before", "after", "later today", "upcoming",
  ],
  ideas: [
    "idea", "what if", "maybe", "could", "imagine", "concept", "thought",
    "how about", "wouldn't it be", "brainstorm", "proposal", "consider",
    "explore", "invent", "create", "suggest", "vision", "inspiration",
    "dream", "plan for", "strategy", "innovation", "experiment", "try to",
    "possible",
  ],
  notes: [],
};

export function localCategorize(text: string): Category {
  const lower = text.toLowerCase();
  const scores: Record<Category, number> = { tasks: 0, ideas: 0, reminders: 0, notes: 0 };
  for (const [cat, kws] of Object.entries(KW)) {
    for (const kw of kws) {
      if (lower.includes(kw)) scores[cat as Category]++;
    }
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? (best[0] as Category) : "notes";
}

export function grokConfigured(): boolean {
  if (typeof window === "undefined") return false;
  return true;
}

export async function classifyWithGrok(text: string, signal?: AbortSignal): Promise<ClassifyResult> {
  const trimmed = text.trim();
  if (!trimmed) return { category: "notes", confidence: 0, source: "local" };

  try {
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal,
    });

    if (!res.ok) {
      return { category: localCategorize(trimmed), confidence: 0.4, source: "local" };
    }

    const data = (await res.json()) as { category?: string; confidence?: number };
    const cat = (ALLOWED as string[]).includes(data.category ?? "")
      ? (data.category as Category)
      : localCategorize(trimmed);
    const conf =
      typeof data.confidence === "number" && data.confidence >= 0 && data.confidence <= 1
        ? data.confidence
        : 0.7;

    return { category: cat, confidence: conf, source: conf >= 0.5 ? "ai" : "local" };
  } catch {
    return { category: localCategorize(trimmed), confidence: 0.4, source: "local" };
  }
}
