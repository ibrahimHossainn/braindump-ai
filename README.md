"#  BrainDump AI — Voice-First Intelligence

> **Speak. It organises everything.**  
> Tasks, Ideas, Reminders, Notes — automatically sorted by AI.

A premium, privacy-first Progressive Web App that turns your voice into clean, structured notes in real time.

###  Key Features

- **Intuitive Voice Capture** — Hold or tap the mic. Smart auto-stop after 3 seconds of silence.
- **Intelligent Categorization** — Automatically sorts your thoughts into Tasks, Ideas, Reminders & Notes.
- **Local-First & Private** — Everything stays in your browser (`localStorage`). No tracking.
- **Beautiful Glassmorphism UI** — Modern dark design with neon cyan and purple accents.
- **Powerful Tools** — Edit, mark complete, delete, share, and export all notes as Markdown.
- **Installable PWA** — Works smoothly on mobile and desktop like a native app.

### Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism
- **Voice**: Web Speech API
- **AI Classification**: Grok (xAI) via Vercel Edge Function + fast local fallback
- **Icons**: Lucide React

### Quick Start (Local Development)

```bash
npm install
npm run dev
Open http://localhost:5173

Live Demo
👉 https://braindump-ai-ebon.vercel.app

Project Structure
braindump-ai/
├── artifacts/braindump/          # Main React frontend (Vite)
├── artifacts/api-server/         # Backend services (optional)
├── publish/braindump-ai/         # Clean standalone version for Vercel/GitHub
│   ├── api/classify.ts           # Grok AI Edge Function
│   ├── src/
│   ├── public/
│   └── package.json
├── package.json
└── pnpm-workspace.yaml
Deployment to Vercel (Recommended)
Push the repository to GitHub
Import it on vercel.com
(Optional but recommended) Add GROK_API_KEY in Environment Variables for better AI classification
Deploy
Note: Grok classification runs securely on Vercel Edge. Your API key stays server-side.

Browser Support
Best performance in Chrome and Edge. Voice recognition is powered by the browser’s native Web Speech API (Safari also supported on iOS 14.5+). Firefox is not supported yet.

Author
Md. Ibrahim Hossain — Digital Identity Strategist

License
MIT © Md. Ibrahim Hossain"
 
