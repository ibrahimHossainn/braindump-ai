import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => Promise<string>;
  resetTranscript: () => void;
  isSupported: boolean;
}

interface UseSpeechRecognitionOptions {
  /** Auto-stop after this many ms of silence. Default 3000ms. Set 0 to disable. */
  silenceTimeoutMs?: number;
  /** Called with the deduped final transcript when auto-stop fires. */
  onAutoStop?: (transcript: string) => void;
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}): SpeechRecognitionHook {
  const { silenceTimeoutMs = 3000, onAutoStop } = opts;

  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const lastFinalRef = useRef<string>("");
  const seenSegmentsRef = useRef<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const onAutoStopRef = useRef(onAutoStop);

  useEffect(() => {
    onAutoStopRef.current = onAutoStop;
  }, [onAutoStop]);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ?? null
      : null;
  const isSupported = !!SpeechRecognition;

  const isOverlap = useCallback((existing: string, segment: string): boolean => {
    if (!existing || !segment) return false;
    const e = existing.toLowerCase();
    const s = segment.toLowerCase();
    if (e.includes(s)) return true;
    const segWords = s.split(/\s+/).filter(Boolean);
    const exWords = e.split(/\s+/).filter(Boolean);
    if (segWords.length < 2 || exWords.length < 2) return false;
    const tail = exWords.slice(-Math.min(exWords.length, segWords.length + 5)).join(" ");
    let m = 0;
    for (const w of segWords) if (tail.includes(w)) m++;
    return m / segWords.length > 0.7;
  }, []);

  const dedupeText = useCallback((text: string): string => {
    let result = text.trim().replace(/\s+/g, " ");
    if (!result) return "";
    result = result.replace(/\b(\w+)(\s+\1)+\b/gi, "$1");
    for (let n = 12; n >= 2; n--) {
      const words = result.split(/\s+/).filter(Boolean);
      const out: string[] = [];
      let i = 0;
      while (i < words.length) {
        let skipped = false;
        if (i + n * 2 <= words.length) {
          const phrase = words.slice(i, i + n).join(" ").toLowerCase();
          const next = words.slice(i + n, i + n * 2).join(" ").toLowerCase();
          if (phrase === next) {
            out.push(...words.slice(i, i + n));
            i += n * 2;
            while (i + n <= words.length) {
              const again = words.slice(i, i + n).join(" ").toLowerCase();
              if (again === phrase) i += n;
              else break;
            }
            skipped = true;
          }
        }
        if (!skipped) {
          out.push(words[i]);
          i++;
        }
      }
      result = out.join(" ");
    }
    const sentences = result.split(/(?<=[.!?])\s+|(?=\b[A-Z])/).filter((s) => s.trim().length > 0);
    if (sentences.length > 1) {
      const seen = new Set<string>();
      const uniq: string[] = [];
      for (const s of sentences) {
        const k = s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
        if (!seen.has(k)) {
          seen.add(k);
          uniq.push(s.trim());
        }
      }
      result = uniq.join(" ");
    }
    return result.trim().replace(/\s+/g, " ");
  }, []);

  const scheduleUpdate = useCallback((finalText: string, interimText: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFinalTranscript(finalText);
      setInterimTranscript(interimText);
    }, 250);
  }, []);

  const stopInternal = useCallback((): string => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (silenceRef.current) {
      clearTimeout(silenceRef.current);
      silenceRef.current = null;
    }
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    const cleanFinal = dedupeText(lastFinalRef.current);
    setFinalTranscript(cleanFinal);
    setInterimTranscript("");
    return cleanFinal;
  }, [dedupeText]);

  const armSilence = useCallback(() => {
    if (silenceTimeoutMs <= 0) return;
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = setTimeout(() => {
      if (!isListeningRef.current) return;
      const finalText = stopInternal();
      onAutoStopRef.current?.(finalText);
    }, silenceTimeoutMs);
  }, [silenceTimeoutMs, stopInternal]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || isListeningRef.current) return;

    lastFinalRef.current = "";
    seenSegmentsRef.current.clear();
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
          const segKey = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
          if (segKey.length < 2) continue;
          if (seenSegmentsRef.current.has(segKey)) continue;
          if (isOverlap(finalText, transcript)) continue;
          seenSegmentsRef.current.add(segKey);
          finalText = dedupeText(finalText + " " + transcript);
        } else {
          interimText = transcript;
        }
      }

      lastFinalRef.current = finalText;
      scheduleUpdate(finalText, interimText);
      armSilence();
    };

    recognition.onspeechstart = () => armSilence();
    recognition.onaudiostart = () => armSilence();

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    isListeningRef.current = true;
    armSilence();
  }, [SpeechRecognition, dedupeText, isOverlap, scheduleUpdate, armSilence]);

  const stopListening = useCallback(async (): Promise<string> => {
    return stopInternal();
  }, [stopInternal]);

  const resetTranscript = useCallback(() => {
    lastFinalRef.current = "";
    seenSegmentsRef.current.clear();
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (silenceRef.current) clearTimeout(silenceRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
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
