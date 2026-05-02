# 🎙️ BrainDump AI — Voice First Intelligence

> **Speak. It organizes everything.**
> Tasks, Ideas, Reminders, Notes — automatically sorted by AI.

A premium, privacy first PWA that turns your voice into clean, structured notes in real time. Built with React, Vite, TypeScript, Tailwind and a Vercel Edge function that proxies xAI's **Groq** model for secure server side classification.

##  Key Features
- **Intuitive Voice Capture** — Hold or tap the mic. Web Speech API with on the fly deduplication.
- **Auto Stop on Silence** — Stops recording after 3 seconds of silence automatically.
- **Groq Powered AI Classification** — Sorts into Tasks, Ideas, Reminders & Notes via Vercel Edge. Your API key never touches the browser.
- **Local First & Private** — Everything stays in your browser (`localStorage`). No tracking, no servers.
- **Powerful Tools** — Edit, delete, share, mark complete per entry.
- **Markdown Export** — Export your entire brain dump with one tap.
- **Beautiful Glassmorphism UI** — Modern dark design with neon cyan and purple accents.
- **Installable PWA** — Works smoothly on mobile and desktop like a native app.

## 🔗 Live Demo
👉 https://braindump-ai-ebon.vercel.app

##  Tech Stack
- **Core**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism
- **Voice**: Web Speech API (Local)
- **AI**: Grok (xAI) via Vercel Edge Function + fast local fallback
- **Icons**: Lucide React

##  Quick Start

```bash
npm install
npm run dev
Open http://localhost:5173

The Edge function at /api/classify only runs on Vercel. In local dev, the app falls back to a fast local keyword classifier. To preview the full Edge experience locally:

Bash
￼
npm i -g vercel
vercel dev
 Deploying to Vercel
Push this repo to GitHub.

Import the repo on vercel.com/new.

Vercel auto-detects Vite. Build: npm run build, Output: dist/.

Add environment variable:

Key	Value
GROQ_API_KEY	Your xAI key (no VITE_ prefix)
Get a key at x.ai/api.

Deploy. Your app is live with the Edge classifier wired in.

Important: The API key is read server side only by api/classify.ts. It is never bundled into the client.

📂 Project Structure
text
￼
braindump-ai/
├── api/
│   └── classify.ts              # Vercel Edge Function (Grok proxy)
├── public/                      # PWA icons, manifest, favicon
├── src/
│   ├── components/              # MicButton, EntryCard, CategoryTabs, Toast
│   ├── hooks/
│   │   ├── useBrainDump.ts      # Entry store + AI re-classify
│   │   └── useSpeechRecognition.ts  # 3s auto-stop logic
│   ├── lib/
│   │   ├── grok.ts              # /api/classify client wrapper
│   │   └── export.ts            # Markdown export + Web Share
│   ├── pages/
│   │   └── braindump.tsx        # Main page
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── vercel.json                  # SPA rewrites + security headers
 Browser Support
Voice capture uses the Web Speech API, available in Chrome, Edge, and Safari (iOS 14.5+). Firefox is not supported.

🤝🏻 Acquisition & Licensing
Fully functional, clean MVP ready for acquisition or further development. Perfect for anyone who wants a privacy-focused voice productivity tool.

Contact: m.ibrahimhossainn1@gmail.com

 License
MIT © Md. Ibrahim Hossain — Digital Identity Strategist
