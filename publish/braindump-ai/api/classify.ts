// Vercel Edge Function: server-side Grok (xAI) classifier proxy.
// Keeps GROK_API_KEY private. Frontend POSTs { text } and gets back
// { category, confidence }.

export const config = { runtime: "edge" };

const ALLOWED_CATEGORIES = ["tasks", "ideas", "reminders", "notes"] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

interface ClassifyResponse {
  category: Category;
  confidence: number;
}

const SYSTEM_PROMPT = `You are a strict text classifier for a voice-capture app called BrainDump.
Classify the user's note into EXACTLY ONE of these categories:
- "tasks": actionable to-dos the user must complete (buy, finish, call, fix, send, schedule, etc.)
- "reminders": time-bound or event-bound items (appointments, deadlines, "tomorrow", "at 3pm", "next week")
- "ideas": creative thoughts, possibilities, "what if", brainstorming, concepts, proposals
- "notes": general observations, journal entries, references, or anything that doesn't fit above

Reply with ONLY a compact JSON object. No prose, no markdown, no code fences.
Schema: {"category":"<one of tasks|ideas|reminders|notes>","confidence":<float 0..1>}`;

function fallbackCategory(text: string): Category {
  const t = text.toLowerCase();
  if (/\b(remind|tomorrow|tonight|next (week|month)|appointment|deadline|at \d|by \d)\b/.test(t)) return "reminders";
  if (/\b(todo|to do|need to|have to|gotta|must|should|finish|buy|call|send|fix|clean|schedule|book|pay)\b/.test(t)) return "tasks";
  if (/\b(idea|what if|maybe|could|imagine|brainstorm|concept|proposal|vision)\b/.test(t)) return "ideas";
  return "notes";
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  let text = "";
  try {
    const body = (await req.json()) as { text?: unknown };
    if (typeof body.text === "string") text = body.text.trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  if (!text) {
    return new Response(JSON.stringify({ error: "`text` is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  if (text.length > 4000) text = text.slice(0, 4000);

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    const result: ClassifyResponse = { category: fallbackCategory(text), confidence: 0.4 };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  try {
    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        temperature: 0,
        max_tokens: 60,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!upstream.ok) {
      const result: ClassifyResponse = { category: fallbackCategory(text), confidence: 0.4 };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: { category?: string; confidence?: number } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // ignore
        }
      }
    }

    const category =
      parsed.category && (ALLOWED_CATEGORIES as readonly string[]).includes(parsed.category)
        ? (parsed.category as Category)
        : fallbackCategory(text);

    const confidence =
      typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0.85;

    const result: ClassifyResponse = { category, confidence };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch {
    const result: ClassifyResponse = { category: fallbackCategory(text), confidence: 0.4 };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
}
