interface TranscriptDisplayProps {
  finalTranscript: string;
  interimTranscript: string;
  isListening: boolean;
}

export default function TranscriptDisplay({
  finalTranscript,
  interimTranscript,
  isListening,
}: TranscriptDisplayProps) {
  if (!isListening && !finalTranscript && !interimTranscript) return null;

  return (
    <div className="glass-card p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-2">
        {isListening && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span className="text-xs font-medium text-neon-cyan mono uppercase tracking-wider">
              Listening
            </span>
            <span className="text-[10px] text-zinc-500 ml-1">auto-stops after 3s silence</span>
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed min-h-[1.5rem]">
        {finalTranscript && <span className="text-white/90">{finalTranscript}</span>}
        {interimTranscript && (
          <span className="text-zinc-400/70 italic"> {interimTranscript}</span>
        )}
        {!finalTranscript && !interimTranscript && (
          <span className="text-zinc-400 italic">Speak now…</span>
        )}
      </p>
    </div>
  );
}
