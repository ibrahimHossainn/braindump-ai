interface TranscriptDisplayProps {
  transcript: string;
  isListening: boolean;
}

const TranscriptDisplay = ({ transcript, isListening }: TranscriptDisplayProps) => {
  if (!isListening && !transcript) return null;

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
      <p className="text-sm text-foreground/80 leading-relaxed min-h-[1.5rem]">
        {transcript || (
          <span className="text-muted-foreground italic">Speak now...</span>
        )}
      </p>
    </div>
  );
};

export default TranscriptDisplay;
