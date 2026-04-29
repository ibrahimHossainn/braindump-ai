# BrainDump — Voice-First AI Capture

> Speak. It organises everything. Tasks, ideas, reminders, notes — sorted by AI.

A premium, privacy-first PWA that turns your voice into structured thought-streams. Built with React, Vite, TypeScript, Tailwind, and a Vercel Edge function that proxies xAI's **Grok** model for server-side classification.

**Author:** Md. Ibrahim Hossain — Digital Identity Strategist
**License:** MIT

---

## Features

- One-tap **voice capture** (Web Speech API, with on-the-fly deduplication).
- **Auto-stop after 3s of silence** — never sit there with the mic on.
- **Grok-powered AI classification** into Tasks / Ideas / Reminders / Notes (server-side via Vercel Edge — your API key never touches the browser).
- **Edit, delete, share, complete** per entry.
- **Markdown export** of your entire brain dump.
- **Web Share API** with clipboard fallback.
- Dark **glassmorphism** UI with neon cyan + purple accents.
- 100% offline-first — entries persist in `localStorage`.
- Installable **PWA** (manifest + icons included).

---

## Quick start (local dev)

```bash
npm install
npm run dev
```

The Edge function at `/api/classify` only runs on Vercel. In local `vite dev` it isn't served, so the app gracefully falls back to a fast local keyword classifier. To preview the full Edge experience locally, install the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

---

## Deploying to Vercel

1. Push this repo to GitHub (e.g. `Braindump-AI`).
2. Import the repo on [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Vite. Build command `npm run build`, output `dist/`.
4. Add environment variable:

   | Key             | Value                       |
   | --------------- | --------------------------- |
   | `GROK_API_KEY`  | Your xAI key (no `VITE_` prefix) |

   Get a key at [x.ai/api](https://x.ai/api).
5. Deploy. Your app is live at `your-project.vercel.app` with the Edge classifier wired in.

> **Important:** The key is read **server-side only** by `api/classify.ts`. It is never bundled into the client.

---

## Project structure

```
braindump-ai/
├── api/
│   └── classify.ts          # Vercel Edge function — Grok proxy
├── public/                  # PWA icons, manifest, favicon
├── src/
│   ├── components/          # MicButton, EntryCard, CategoryTabs, …
│   ├── hooks/
│   │   ├── useBrainDump.ts  # Entry store + AI re-classify
│   │   └── useSpeechRecognition.ts  # 3s auto-stop
│   ├── lib/
│   │   ├── grok.ts          # /api/classify client wrapper
│   │   └── export.ts        # Markdown export + Web Share
│   ├── pages/
│   │   └── braindump.tsx    # Main page
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vercel.json              # SPA rewrites + security headers
└── .env.example
```

---

## Browser support

Voice capture uses the [Web Speech API](https://developer.mozilla.org/docs/Web/API/Web_Speech_API), which is available in **Chrome, Edge, and Safari (iOS 14.5+)**. Firefox is not supported.

---

## License

MIT © Md. Ibrahim Hossain
