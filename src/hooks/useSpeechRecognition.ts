import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const lastFinalRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedFinalRef = useRef("");

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentInterim = "";
      let newFinals = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          // Deduplicate: skip if identical to the last committed final chunk
          const trimmed = text.trim();
          if (trimmed && trimmed !== lastFinalRef.current) {
            newFinals += text;
            lastFinalRef.current = trimmed;
          }
        } else {
          currentInterim += text;
        }
      }

      // Accumulate finals across multiple onresult fires
      if (newFinals) {
        accumulatedFinalRef.current += newFinals;

        // Debounce the state update to batch rapid final results
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setFinalTranscript(accumulatedFinalRef.current.trim());
        }, 350);
      }

      setInterimTranscript(currentInterim);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      // Flush any pending debounced update
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (accumulatedFinalRef.current.trim()) {
        setFinalTranscript(accumulatedFinalRef.current.trim());
      }
      setInterimTranscript("");
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      recognition.abort();
    };
  }, [SpeechRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    // Reset all buffers
    accumulatedFinalRef.current = "";
    lastFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {}
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedFinalRef.current = "";
    lastFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    finalTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}
