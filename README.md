# 🎙️ BrainDump AI - Voice First Intelligence

> **Speak. It organizes everything.**
> A premium, privacy first PWA that turns your voice into structured thought streams.

Built with a focus on **zero cost** and **absolute privacy**. It leverages the browser's native Web Speech API to eliminate the need for expensive cloud APIs.

## Key Highlights
*   **Zero API Bills**: 100% powered by browser native Web Speech API.
*   **Privacy Centric**: All processing happens on the device. No servers, no data collection.
*   **Smart Categorization**: Automatically sorts voice notes into **Tasks, Ideas, Reminders, & Notes**.
*   **PWA Enabled**: Install it as a native app on iOS, Android, or Desktop.
*   **Offline First**: Entries persist in localStorage. Works without internet.

## Tech Stack
*   **Core**: React 18 + Vite + TypeScript
*   **Styling**: Tailwind CSS + Glassmorphism UI
*   **Voice Engine**: Web Speech API (Local)
*   **Icons**: Lucide React
*   **Deployment**: Vercel (Edge Functions ready)

## Development Setup
1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Launch development server: `npm run dev`
4.  Access at: `http://localhost:5173`

## Project Structure
The project follows a clean and scalable structure:

```text
braindump-ai/
├── public/                  # PWA icons, manifest, favicon
├── src/
│   ├── components/          # MicButton, EntryCard, CategoryTabs, Toast
│   ├── hooks/               # useBrainDump, useSpeechRecognition
│   ├── lib/                 # AI wrapper (Grok), Markdown export
│   ├── pages/               # Main application page
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
 Deployment
This project is optimized for Vercel.

Push code to GitHub.
Import project on 
1
.
Vercel auto-detects settings (Build: npm run build, Output: dist).
(Optional) Add GROK_API_KEY env variable for server-side AI classification.
 License
MIT © MD. Ibrahim Hossain - Digital Identity Strategist
