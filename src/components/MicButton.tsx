import { useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  isSupported: boolean;
}

const MicButton = ({ isListening, onClick, onHoldStart, onHoldEnd, isSupported }: MicButtonProps) => {
  const holdRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handlePointerDown = () => {
    if (!isSupported || isListening) return;
    holdRef.current = false;
    timerRef.current = setTimeout(() => {
      holdRef.current = true;
      onHoldStart?.();
    }, 300);
  };

  const handlePointerUp = () => {
    clearTimeout(timerRef.current);
    if (holdRef.current) {
      holdRef.current = false;
      onHoldEnd?.();
    }
  };

  const handleClick = () => {
    if (holdRef.current) return;
    onClick();
  };

  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <span className="absolute w-24 h-24 rounded-full border border-neon-cyan/30 pulse-ring" />
          <span className="absolute w-32 h-32 rounded-full border border-neon-purple/20 pulse-ring-delay" />
          <span className="absolute w-40 h-40 rounded-full border border-neon-cyan/10 pulse-ring-delay-2" />
        </>
      )}

      <button
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={!isSupported}
        className={`
          relative z-10 w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300 select-none touch-none
          ${isListening
            ? "neon-glow-strong bg-neon-cyan/20 border-2 border-neon-cyan/60 scale-110"
            : "neon-glow glass-card border border-neon-cyan/30 hover:border-neon-cyan/50 hover:scale-105"
          }
          ${!isSupported ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-label={isListening ? "Stop recording" : "Start recording"}
      >
        {isListening ? (
          <MicOff className="w-8 h-8 text-neon-cyan" />
        ) : (
          <Mic className="w-8 h-8 text-neon-cyan" />
        )}
      </button>
    </div>
  );
};

export default MicButton;
