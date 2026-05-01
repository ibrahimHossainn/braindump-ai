# 🎙️ BrainDump AI - Voice First Intelligence

> **Speak. It organizes everything.**  
> A privacy first PWA that turns your voice into structured notes in real time.

BrainDump AI lets you speak your thoughts and automatically organizes them into **Tasks, Ideas, Reminders, and Notes** — all running locally in the browser with **zero API cost** and **full privacy**.

### Key Highlights
- **Zero API Cost** — Powered entirely by the browser’s native Web Speech API
- **Complete Privacy** — Nothing leaves your device. No servers, no tracking
- **Smart Categorization** — Automatically sorts notes using AI (with local fallback)
- **Installable PWA** — Works as a native app on mobile and desktop
- **Offline First** — All entries saved in localStorage

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism
- **Voice**: Web Speech API (Local)
- **Icons**: Lucide React
- **Deployment**: Vercel

### Development Setup
```bash
git clone <your-repo-url>
cd braindump-ai
npm install
npm run dev
Open http://localhost:5173

Live Demo
👉 https://braindump-ai-ebon.vercel.app

Project Structure
braindump-ai/
├── public/          # PWA icons, manifest, favicon
├── src/
│   ├── components/  # UI components
│   ├── hooks/       # Core logic (useBrainDump, speech recognition)
│   ├── lib/         # Utilities and AI wrapper
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.ts
Deployment
Optimized for Vercel. Just connect your GitHub repository — Vercel will auto-detect Vite settings.

(Optional) Add GROK_API_KEY environment variable for enhanced AI categorization.

Acquisition Opportunity
Fully functional, privacy-focused voice note-taking MVP. Ideal for:

Launching a no-cost productivity tool
Building a cross-platform note-taking ecosystem
Adding advanced features like multi-language support
Interested in acquiring or collaborating?
Contact: m.ibrahimhossainn1@gmail.com
Twitter: @_IbrahimHossain

License
MIT © Md. Ibrahim Hossain — Digital Identity Strategist
