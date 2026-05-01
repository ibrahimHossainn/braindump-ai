"# 🎙️ BrainDump AI — Voice First Intelligence

> **Speak your thoughts. Let AI organize them.**

BrainDump AI is a beautiful, privacy-first voice note-taking Progressive Web App (PWA) that instantly transcribes your speech and intelligently categorizes everything into **Tasks • Ideas • Reminders • Notes**.

###  Key Features

- **Hold-to-Speak** — Intuitive mic button with 3-second silence auto-stop
- **Smart AI Categorization** — Powered by Grok (xAI) with fast local fallback
- **100% Offline First** — Everything saved in localStorage, works without internet
- **Installable PWA** — Feels like a native app on mobile & desktop
- **Modern Glassmorphism Design** — Clean neon cyan & purple aesthetic
- **Powerful Actions** — Edit, complete, delete, share, and export as Markdown

### Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism
- **Voice**: Web Speech API (Chrome/Edge/Safari)
- **AI**: Grok via Vercel Edge Function (optional) + Local Keyword Classifier
- **Icons**: Lucide React

### Live Demo

👉 **[https://braindump-ai-ebon.vercel.app](https://braindump-ai-ebon.vercel.app)**

### Quick Start

```bash
git clone https://github.com/ibrahimHossainn/braindump-ai.git
cd braindump-ai
npm install
npm run dev
Open http://localhost:5173

Optional: Enable Grok AI (Recommended)
For much better categorization:

Get your free API key from x.ai/api
Add GROK_API_KEY in Vercel Project Settings → Environment Variables
Redeploy
Note: Grok classification happens securely on the server via Vercel Edge. Your key never touches the browser.

Project Structure
publish/braindump-ai/          # Standalone version (recommended for GitHub)
├── api/classify.ts            # Vercel Edge Function for Grok
├── public/                    # PWA icons & manifest
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── pages/braindump.tsx
├── package.json
└── vercel.json
Browser Support
Best experience in Chrome and Edge. Voice recognition is powered by the browser’s native Web Speech API (Firefox currently not supported).

License
MIT © Md. Ibrahim Hossain — Digital Identity Strategist"
 https://grok.com/c/884e0f27-8c9e-4bf8-9a1e-8b62b60f399c#:~:text=%23%20%F0%9F%8E%99%EF%B8%8F%20BrainDump%20AI%20%E2%80%94%20Voice,Digital%20Identity%20Strategist
