import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => Promise<string>;
  resetTranscript: () => void;
  isSupported: boolean;
}

const DEBOUNCE_MS = 450;

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const lastFinalRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);

  const SpeechRecognition = typeof window !== "undefined"
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ?? null
    : null;

  const isSupported = !!SpeechRecognition;

  const cleanText = useCallback((text: string): string => {
    return text.trim().replace(/\s+/g, " ");
  }, []);

  const dedupeText = useCallback((text: string): string => {
    let result = text;

    // Remove consecutive duplicate words
    result = result.replace(/\b(\w+)\s+\1\b/gi, "$1");

    // Remove repeated short phrases (2-5 words)
    for (let n = 5; n >= 2; n--) {
      const words = result.split(/\s+/).filter(Boolean);
      const out: string[] = [];
      let i = 0;
      while (i < words.length) {
        if (i + n * 2 <= words.length) {
          const phrase = words.slice(i, i + n).join(" ").toLowerCase();
          const nextPhrase = words.slice(i + n, i + n * 2).join(" ").toLowerCase();
          if (phrase === nextPhrase) {
            out.push(...words.slice(i, i + n));
            i += n * 2;
            continue;
          }
        }
        out.push(words[i]);
        i++;
      }
      result = out.join(" ");
    }
    return cleanText(result);
  }, [cleanText]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || isListeningRef.current) return;

    lastFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalText = lastFinalRef.current;
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (result.isFinal) {
          finalText = dedupeText(finalText + " " + transcript);
        } else {
          interimText = transcript;
        }
      }

      lastFinalRef.current = finalText;
      setFinalTranscript(finalText);
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    setIsListening(true);
    isListeningRef.current = true;
  }, [SpeechRecognition, dedupeText]);

  const stopListening = useCallback(async (): Promise<string> => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    isListeningRef.current = false;
    setIsListening(false);

    const cleanFinal = dedupeText(lastFinalRef.current);
    setFinalTranscript(cleanFinal);
    setInterimTranscript("");
    return cleanFinal;
  }, [dedupeText]);

  const resetTranscript = useCallback(() => {
    lastFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
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
