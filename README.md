BrainDump - Voice First AI Capture
Speak It organises everything Tasks ideas reminders notes - sorted by AI  

A premium privacy first PWA that turns your voice into structured thought streams Built with React Vite TypeScript Tailwind and a smart classification system that keeps your data secure  
+2

Author Md Ibrahim Hossain — Digital Identity Strategist
License MIT  

Features
One tap voice capture Web Speech API with on the fly deduplication  

Auto stop after 3s of silence - never sit there with the mic on  

Smart AI classification into Tasks / Ideas / Reminders / Notes  

Edit delete share complete per entry  

Markdown export of your entire brain dump  

Web Share API with clipboard fallback  

Dark glassmorphism UI with neon cyan + purple accents  

100% offline first — entries persist in localStorage  

Installable PWA manifest + icons included  

Quick start local dev
npm install
npm run dev  

In local dev the app gracefully falls back to a fast local keyword classifier To preview the full experience locally install the Vercel CLI  
+1

Deploying to Vercel
Push this repo to GitHub  

Import the repo on vercel.com/new

  

Vercel auto detects Vite Build command npm run build output dist/  

Add your API key in environment variables  

Project structure
The project is organized as a clean and scalable monorepo  

braindump-ai/
├── artifacts/api-server/    # Backend classification proxy
├── artifacts/braindump/     # Main application source code
├── public/                  # PWA icons manifest favicon
├── src/
│   ├── components/          # MicButton EntryCard CategoryTabs
│   ├── hooks/               # useBrainDump useSpeechRecognition
│   ├── lib/                 # AI wrapper and Markdown export
│   └── pages/               # Main application pages
├── package.json
├── tailwind.config.ts
└── tsconfig.json  
+4

Browser support
Voice capture uses the Web Speech API which is available in Chrome Edge and Safari iOS 14.5+ Firefox is not supported  
+1

MIT © Md Ibrahim Hossain
