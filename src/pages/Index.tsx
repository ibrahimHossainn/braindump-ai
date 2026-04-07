import { useState, useMemo } from "react";
import { Brain, Sparkles, Search, X, Trash2 } from "lucide-react";
import MicButton from "@/components/MicButton";
import CategoryTabs from "@/components/CategoryTabs";
import EntryCard from "@/components/EntryCard";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "@/hooks/use-toast";
import { useBrainDump, type Category } from "@/hooks/useBrainDump";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Category>("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { isListening, finalTranscript, interimTranscript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition();

  const { addEntry, deleteEntry, toggleDone, getByCategory, entries } = useBrainDump();

  const handleMicClick = async () => {
    if (isListening) {
      const transcript = await stopListening();
      if (transcript.trim()) {
        addEntry(transcript);
        toast({ title: "Note saved", duration: 1800 });
      }
      resetTranscript();
    } else {
      startListening();
    }
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
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 border-b border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-cyan-400">BrainDump</h1>
              <p className="text-xs text-zinc-400">Voice-First AI Capture</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
              className="text-zinc-400 hover:text-cyan-400 transition-colors"
            >
              {showSearch ? <X size={22} /> : <Search size={22} />}
            </button>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Sparkles size={16} className="text-purple-400" />
              <span>{entries.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mic Section */}
      <section className="px-4 py-10">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-6">
          <MicButton
            isListening={isListening}
            onClick={handleMicClick}
            onHoldStart={startListening}
            onHoldEnd={async () => {
              const transcript = await stopListening();
              if (transcript.trim()) {
                addEntry(transcript);
                toast({ title: "Note saved", duration: 1800 });
              }
              resetTranscript();
            }}
            isSupported={isSupported}
          />
          <p className="text-sm text-zinc-400 text-center">
            {isListening ? "Release to save • Tap to stop" : "Hold to record • Tap to toggle"}
          </p>
        </div>
      </section>

      {/* Live Transcript */}
      <div className="px-4 max-w-lg mx-auto w-full">
        <TranscriptDisplay finalTranscript={finalTranscript} interimTranscript={interimTranscript} isListening={isListening} />
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 max-w-lg mx-auto pb-4">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-3xl px-4 py-3">
            <Search size={18} className="text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent flex-1 outline-none text-sm"
            />
          </div>
        </div>
      )}

      {/* Tabs + Feed */}
      <section className="flex-1 px-4 pb-8">
        <div className="max-w-lg mx-auto">
          <CategoryTabs active={activeTab} onChange={setActiveTab} counts={counts} />

          <div className="mt-6 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No {activeTab} yet.<br />Hold the mic and speak!
              </div>
            ) : (
              filtered.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={deleteEntry}
                  onToggle={toggleDone}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
