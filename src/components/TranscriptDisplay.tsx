interface TranscriptDisplayProps {
  finalTranscript: string;
  interimTranscript: string;
  isListening: boolean;
}

const TranscriptDisplay = ({ finalTranscript, interimTranscript, isListening }: TranscriptDisplayProps) => {
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
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed min-h-[1.5rem]">
        {finalTranscript && (
          <span className="text-foreground/90">{finalTranscript}</span>
        )}
        {interimTranscript && (
          <span className="text-muted-foreground/60 italic"> {interimTranscript}</span>
        )}
        {!finalTranscript && !interimTranscript && (
          <span className="text-muted-foreground italic">Speak now...</span>
        )}
      </p>
    </div>
  );
};

export default TranscriptDisplay;
