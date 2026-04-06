import { useState, useMemo } from "react";
import { Brain, Sparkles, Search, X } from "lucide-react";
import MicButton from "@/components/MicButton";
import CategoryTabs from "@/components/CategoryTabs";
import EntryCard from "@/components/EntryCard";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "@/hooks/use-toast";
import { useBrainDump, type Category } from "@/hooks/useBrainDump";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Category>("tasks");
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center neon-glow">
              <Brain className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight neon-text text-foreground">
                BrainDump
              </h1>
              <p className="text-[10px] text-muted-foreground mono uppercase tracking-widest">
                Voice-First AI Capture
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-cyan transition-colors"
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mono">
              <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
              <span>{entries.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mic Section */}
      <section className="px-4 py-8">
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
          <p className="text-xs text-muted-foreground text-center">
            {!isSupported
              ? "Speech recognition not supported in this browser"
              : isListening
                ? "Release to save · Tap to stop"
                : "Hold to record · Tap to toggle"
            }
          </p>
        </div>
      </section>

      {/* Transcript */}
      <div className="px-4 max-w-lg mx-auto w-full">
        <TranscriptDisplay finalTranscript={finalTranscript} interimTranscript={interimTranscript} isListening={isListening} />
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-4 max-w-lg mx-auto w-full pb-2">
          <div className="glass-card flex items-center gap-2 px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              autoFocus
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>
        </div>
      )}

      {/* Tabs + Entries */}
      <section className="flex-1 px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto space-y-4">
          <CategoryTabs active={activeTab} onChange={setActiveTab} counts={counts} />

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No {activeTab} yet. Tap the mic and start talking!
                </p>
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
