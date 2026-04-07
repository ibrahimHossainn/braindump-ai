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

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const lastFinalRef = useRef<string>("");
  const seenSegmentsRef = useRef<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);

  const SpeechRecognition = typeof window !== "undefined"
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ?? null
    : null;

  const isSupported = !!SpeechRecognition;

  // Check if newSegment is already substantially contained in existing text
  const isOverlap = useCallback((existing: string, segment: string): boolean => {
    if (!existing || !segment) return false;
    const eLower = existing.toLowerCase();
    const sLower = segment.toLowerCase();
    // Direct substring check
    if (eLower.includes(sLower)) return true;
    // Check if the segment's words overlap with the tail of existing text
    const segWords = sLower.split(/\s+/).filter(Boolean);
    const exWords = eLower.split(/\s+/).filter(Boolean);
    if (segWords.length < 2 || exWords.length < 2) return false;
    // Check if >70% of segment words appear at end of existing
    const tailSize = Math.min(exWords.length, segWords.length + 5);
    const tail = exWords.slice(-tailSize).join(" ");
    let matchCount = 0;
    for (const w of segWords) {
      if (tail.includes(w)) matchCount++;
    }
    return matchCount / segWords.length > 0.7;
  }, []);

  // Aggressive multi-pass deduplication
  const dedupeText = useCallback((text: string): string => {
    let result = text.trim().replace(/\s+/g, " ");
    if (!result) return "";

    // Pass 1: Remove consecutive duplicate words
    result = result.replace(/\b(\w+)(\s+\1)+\b/gi, "$1");

    // Pass 2: Remove repeated N-word phrases (up to 12 words)
    for (let n = 12; n >= 2; n--) {
      const words = result.split(/\s+/).filter(Boolean);
      const out: string[] = [];
      let i = 0;
      while (i < words.length) {
        let skipped = false;
        if (i + n * 2 <= words.length) {
          const phrase = words.slice(i, i + n).join(" ").toLowerCase();
          const nextPhrase = words.slice(i + n, i + n * 2).join(" ").toLowerCase();
          if (phrase === nextPhrase) {
            out.push(...words.slice(i, i + n));
            i += n * 2;
            // Skip any further consecutive repeats of the same phrase
            while (i + n <= words.length) {
              const again = words.slice(i, i + n).join(" ").toLowerCase();
              if (again === phrase) { i += n; } else break;
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

    // Pass 3: Remove repeated sentences
    const sentences = result.split(/(?<=[.!?])\s+|(?=\b[A-Z])/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      const seen = new Set<string>();
      const uniqueSentences: string[] = [];
      for (const s of sentences) {
        const key = s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
        if (!seen.has(key)) {
          seen.add(key);
          uniqueSentences.push(s.trim());
        }
      }
      result = uniqueSentences.join(" ");
    }

    return result.trim().replace(/\s+/g, " ");
  }, []);

  const scheduleUpdate = useCallback((finalText: string, interimText: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFinalTranscript(finalText);
      setInterimTranscript(interimText);
    }, 400);
  }, []);

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
          // Normalize for comparison
          const segKey = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
          
          // Skip if we've already seen this exact segment or it overlaps heavily
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
  }, [SpeechRecognition, dedupeText, isOverlap, scheduleUpdate]);

  const stopListening = useCallback(async (): Promise<string> => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
    seenSegmentsRef.current.clear();
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
