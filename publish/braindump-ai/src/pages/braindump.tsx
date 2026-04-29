import { useCallback, useMemo, useState } from "react";
import { Brain, Download, Search, Sparkles, X } from "lucide-react";
import MicButton from "@/components/MicButton";
import CategoryTabs from "@/components/CategoryTabs";
import EntryCard from "@/components/EntryCard";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import { ToastViewport, toast } from "@/components/Toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useBrainDump, type Category, type DumpEntry } from "@/hooks/useBrainDump";
import { downloadMarkdown, shareEntry } from "@/lib/export";

export default function BrainDumpPage() {
  const [activeTab, setActiveTab] = useState<Category>("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { addEntry, deleteEntry, toggleDone, editEntry, getByCategory, entries } = useBrainDump();

  const handleAutoStop = useCallback(
    (transcript: string) => {
      const t = transcript.trim();
      if (t) {
        addEntry(t);
        toast("Note saved");
      }
    },
    [addEntry]
  );

  const {
    isListening,
    finalTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition({ silenceTimeoutMs: 3000, onAutoStop: handleAutoStop });

  const handleMicClick = async () => {
    if (isListening) {
      const transcript = await stopListening();
      if (transcript.trim()) {
        addEntry(transcript);
        toast("Note saved");
      }
      resetTranscript();
    } else {
      startListening();
    }
  };

  const handleHoldEnd = async () => {
    const transcript = await stopListening();
    if (transcript.trim()) {
      addEntry(transcript);
      toast("Note saved");
    }
    resetTranscript();
  };

  const handleShare = async (entry: DumpEntry) => {
    const result = await shareEntry(entry);
    if (result === "shared") toast("Shared");
    else if (result === "copied") toast("Copied to clipboard");
    else toast("Share failed");
  };

  const handleExport = () => {
    if (entries.length === 0) {
      toast("Nothing to export yet");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadMarkdown(entries, `braindump-${stamp}.md`);
    toast("Markdown exported");
  };

  const filtered = useMemo(() => {
    const byCategory = getByCategory(activeTab);
    if (!searchQuery.trim()) return byCategory;
    const q = searchQuery.toLowerCase();
    return byCategory.filter((e) => e.text.toLowerCase().includes(q));
  }, [activeTab, getByCategory, searchQuery]);

  const counts: Record<Category, number> = {
    tasks: getByCategory("tasks").length,
    ideas: getByCategory("ideas").length,
    reminders: getByCategory("reminders").length,
    notes: getByCategory("notes").length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 pt-6 pb-4 border-b border-zinc-800/60">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neon-cyan">BrainDump</h1>
              <p className="text-[11px] text-zinc-400">Voice-First AI Capture</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              aria-label="Export to Markdown"
              className="text-zinc-400 hover:text-neon-cyan transition-colors"
              title="Export to Markdown"
            >
              <Download size={20} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSearch((s) => !s);
                setSearchQuery("");
              }}
              aria-label={showSearch ? "Close search" : "Open search"}
              className="text-zinc-400 hover:text-neon-cyan transition-colors"
            >
              {showSearch ? <X size={22} /> : <Search size={22} />}
            </button>
            <div className="flex items-center gap-1 text-xs text-zinc-400 mono">
              <Sparkles size={14} className="text-neon-purple" />
              <span>{entries.length}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 py-10">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-6">
          <MicButton
            isListening={isListening}
            onClick={handleMicClick}
            onHoldStart={startListening}
            onHoldEnd={handleHoldEnd}
            isSupported={isSupported}
          />
          <p className="text-sm text-zinc-400 text-center">
            {!isSupported
              ? "Voice not supported in this browser. Try Chrome or Edge."
              : isListening
              ? "Release to save • Tap to stop"
              : "Hold to record • Tap to toggle"}
          </p>
        </div>
      </section>

      <div className="px-4 max-w-lg mx-auto w-full">
        <TranscriptDisplay
          finalTranscript={finalTranscript}
          interimTranscript={interimTranscript}
          isListening={isListening}
        />
      </div>

      {showSearch && (
        <div className="px-4 max-w-lg mx-auto w-full pb-4">
          <div className="flex items-center gap-3 bg-zinc-900/70 border border-zinc-700/60 rounded-2xl px-4 py-3">
            <Search size={18} className="text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              className="bg-transparent flex-1 outline-none text-sm text-white placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}

      <section className="flex-1 px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <CategoryTabs active={activeTab} onChange={setActiveTab} counts={counts} />

          <div className="mt-6 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No {activeTab} yet.
                <br />
                Hold the mic and speak.
              </div>
            ) : (
              filtered.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={deleteEntry}
                  onToggle={toggleDone}
                  onEdit={editEntry}
                  onShare={handleShare}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <footer className="px-4 pb-6 text-center text-[11px] text-zinc-600">
        Made by Md. Ibrahim Hossain — Digital Identity Strategist
      </footer>

      <ToastViewport />
    </div>
  );
}
