BrainDump — Voice-First AI Capture
Speak It organises everything Tasks ideas reminders notes — sorted by AI  

A premium privacy-first PWA that turns your voice into structured thought-streams Built with React Vite TypeScript Tailwind and a smart classification system for secure data processing  
+2

Author Md Ibrahim Hossain — Digital Identity Strategist
License MIT  
+1

Features
One-tap voice capture Web Speech API with on-the-fly deduplication  

Auto-stop after 3s of silence — never sit there with the mic on  

Smart AI classification into Tasks / Ideas / Reminders / Notes  

Edit delete share complete per entry  

Markdown export of your entire brain dump  

Web Share API with clipboard fallback  

Dark glassmorphism UI with neon cyan + purple accents  

100% offline-first — entries persist in localStorage  

Installable PWA manifest + icons included  

Quick start local dev
Bash
npm install
npm run dev
In local dev the app gracefully falls back to a fast local keyword classifier To preview the full experience locally install the Vercel CLI  

Bash
npm i -g vercel
vercel dev
Deploying to Vercel
1 Push this repo to GitHub
2 Import the repo on vercel.com/new
3 Vercel auto-detects Vite Build command npm run build output dist/
4 Add your API key in environment variables  
+3

Project structure
The project is organized as a clean and scalable monorepo  

braindump-ai/
├── artifacts/api-server/    # Backend classification proxy[cite: 2]
├── artifacts/braindump/     # Main application source code[cite: 2]
├── public/                  # PWA icons manifest favicon
├── src/
│   ├── components/          # MicButton EntryCard CategoryTabs[cite: 2]
│   ├── hooks/               # useBrainDump useSpeechRecognition[cite: 2]
│   ├── lib/                 # AI wrapper and Markdown export[cite: 2]
│   └── pages/               # Main application pages[cite: 2]
├── package.json
├── tailwind.config.ts
└── tsconfig.json[cite: 2]
Browser support
Voice capture uses the Web Speech API which is available in Chrome Edge and Safari iOS 14.5+ Firefox is not supported  
+1

License
MIT © Md Ibrahim Hossain[cite: 1]
