import { useState } from "react";
import { Brain, Sparkles } from "lucide-react";
import MicButton from "@/components/MicButton";
import CategoryTabs from "@/components/CategoryTabs";
import EntryCard from "@/components/EntryCard";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useBrainDump, type Category } from "@/hooks/useBrainDump";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Category>("tasks");
  const { isListening, finalTranscript, interimTranscript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition();
  const { addEntry, deleteEntry, toggleDone, getByCategory, entries } = useBrainDump();

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      if (finalTranscript.trim()) {
        addEntry(finalTranscript);
        resetTranscript();
      }
    } else {
      startListening();
    }
  };

  const filtered = getByCategory(activeTab);
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mono">
            <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
            <span>{entries.length} captured</span>
          </div>
        </div>
      </header>

      {/* Mic Section */}
      <section className="px-4 py-8">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-6">
          <MicButton
            isListening={isListening}
            onClick={handleMicClick}
            isSupported={isSupported}
          />
          <p className="text-xs text-muted-foreground text-center">
            {!isSupported
              ? "Speech recognition not supported in this browser"
              : isListening
                ? "Tap to stop & save"
                : "Tap to start voice capture"
            }
          </p>
        </div>
      </section>

      {/* Transcript */}
      <div className="px-4 max-w-lg mx-auto w-full">
        <TranscriptDisplay transcript={transcript} isListening={isListening} />
      </div>

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
