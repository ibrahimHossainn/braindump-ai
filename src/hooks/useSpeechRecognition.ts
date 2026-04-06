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

const DEBOUNCE_MS = 400;

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function dedupeAdjacent(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  for (const w of words) {
    if (result.length === 0 || w.toLowerCase() !== result[result.length - 1].toLowerCase()) {
      result.push(w);
    }
  }
  return result.join(" ");
}

/** Remove repeated phrases (2-4 word ngrams repeated consecutively) */
function dedupeRepeatedPhrases(text: string): string {
  let result = text;
  for (let n = 4; n >= 2; n--) {
    const words = result.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let i = 0;
    while (i < words.length) {
      if (i + n * 2 <= words.length) {
        const phrase = words.slice(i, i + n).map(w => w.toLowerCase()).join(" ");
        const next = words.slice(i + n, i + n * 2).map(w => w.toLowerCase()).join(" ");
        if (phrase === next) {
          // skip the duplicate
          out.push(...words.slice(i, i + n));
          i += n * 2;
          // skip further repeats of the same phrase
          while (i + n <= words.length) {
            const check = words.slice(i, i + n).map(w => w.toLowerCase()).join(" ");
            if (check === phrase) { i += n; } else break;
          }
          continue;
        }
      }
      out.push(words[i]);
      i++;
    }
    result = out.join(" ");
  }
  return result;
}

function cleanFinal(text: string): string {
  return dedupeRepeatedPhrases(dedupeAdjacent(text.replace(/\s+/g, " ").trim()));
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  // Track all final segments by their result index to avoid duplicates
  const finalSegmentsRef = useRef<Map<number, string>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolverRef = useRef<((value: string) => void) | null>(null);
  const isListeningRef = useRef(false);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ?? null
      : null;

  const isSupported = !!SpeechRecognition;

  const buildFinal = useCallback(() => {
    const sorted = [...finalSegmentsRef.current.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
    return cleanFinal(sorted.join(" "));
  }, []);

  const commitFinal = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const text = buildFinal();
    setFinalTranscript(text);
    setInterimTranscript("");
    return text;
  }, [buildFinal]);

  const resolveStop = useCallback(() => {
    const text = commitFinal();
    const resolver = stopResolverRef.current;
    stopResolverRef.current = null;
    resolver?.(text);
    return text;
  }, [commitFinal]);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const results = event.results;
      let interim = "";

      for (let i = event.resultIndex; i < results.length; i++) {
        const result = results[i];
        const text = (result[0]?.transcript ?? "").trim();
        if (!text) continue;

        if (result.isFinal) {
          // Store by index — automatically overwrites if same index fires again
          finalSegmentsRef.current.set(i, text);
        } else {
          interim = text; // only show the latest interim
        }
      }

      // Build the current final from all segments
      const currentFinal = buildFinal();

      // Debounce final transcript update
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFinalTranscript(currentFinal);
        debounceRef.current = null;
      }, DEBOUNCE_MS);

      // Show interim text that isn't already in final
      if (interim) {
        // Strip any overlap with final
        const finalLower = currentFinal.toLowerCase();
        const interimLower = interim.toLowerCase();
        if (!finalLower.includes(interimLower)) {
          setInterimTranscript(dedupeAdjacent(interim));
        } else {
          setInterimTranscript("");
        }
      } else {
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" and "aborted" are non-fatal
      if (event.error === "no-speech" || event.error === "aborted") return;
      setIsListening(false);
      isListeningRef.current = false;
      resolveStop();
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        // Recognition ended unexpectedly (e.g. silence), restart if still listening
        try { recognition.start(); } catch { /* ignore */ }
        return;
      }
      setIsListening(false);
      resolveStop();
    };

    recognitionRef.current = recognition;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      stopResolverRef.current = null;
      recognition.abort();
    };
  }, [SpeechRecognition]); // minimal deps — callbacks use refs

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    finalSegmentsRef.current.clear();
    setFinalTranscript("");
    setInterimTranscript("");
    stopResolverRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    try {
      recognitionRef.current.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch { /* already started */ }
  }, []);

  const stopListening = useCallback(() => {
    return new Promise<string>((resolve) => {
      isListeningRef.current = false;

      if (!recognitionRef.current) {
        resolve(commitFinal());
        return;
      }

      stopResolverRef.current = resolve;

      try {
        recognitionRef.current.stop();
      } catch {
        setIsListening(false);
        resolve(commitFinal());
      }
    });
  }, [commitFinal]);

  const resetTranscript = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    finalSegmentsRef.current.clear();
    stopResolverRef.current = null;
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
