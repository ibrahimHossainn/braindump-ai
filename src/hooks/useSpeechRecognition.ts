import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => Promise<string>;
  resetTranscript: () => void;
  isSupported: boolean;
}

const DEBOUNCE_MS = 350;
const SILENCE_MS = 1200;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeWord = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}'’-]+/gu, "");

const dedupeAdjacentWords = (value: string) => {
  const words = normalizeWhitespace(value).split(" ").filter(Boolean);

  return words
    .filter((word, index) => index === 0 || normalizeWord(word) !== normalizeWord(words[index - 1]))
    .join(" ");
};

const cleanTranscript = (value: string) => dedupeAdjacentWords(normalizeWhitespace(value));

const getComparableWords = (value: string) =>
  cleanTranscript(value)
    .split(" ")
    .map(normalizeWord)
    .filter(Boolean);

const wordsMatch = (left: string[], right: string[]) =>
  left.length === right.length && left.every((word, index) => word === right[index]);

const mergeTranscript = (existing: string, incoming: string) => {
  const base = cleanTranscript(existing);
  const next = cleanTranscript(incoming);

  if (!base) return next;
  if (!next) return base;

  const baseWords = base.split(" ");
  const nextWords = next.split(" ");
  const baseComparable = getComparableWords(base);
  const nextComparable = getComparableWords(next);

  if (wordsMatch(baseComparable, nextComparable)) return base;

  const baseIsPrefix =
    baseComparable.length <= nextComparable.length &&
    baseComparable.every((word, index) => word === nextComparable[index]);

  if (baseIsPrefix) return next;

  const nextIsSuffix =
    nextComparable.length <= baseComparable.length &&
    nextComparable.every(
      (word, index) => word === baseComparable[baseComparable.length - nextComparable.length + index],
    );

  if (nextIsSuffix) return base;

  const maxOverlap = Math.min(baseComparable.length, nextComparable.length);
  let overlap = 0;

  for (let size = maxOverlap; size > 0; size -= 1) {
    const baseSlice = baseComparable.slice(baseComparable.length - size);
    const nextSlice = nextComparable.slice(0, size);

    if (wordsMatch(baseSlice, nextSlice)) {
      overlap = size;
      break;
    }
  }

  return cleanTranscript([...baseWords, ...nextWords.slice(overlap)].join(" "));
};

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const finalBufferRef = useRef("");
  const lastFinalRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolverRef = useRef<((value: string) => void) | null>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceRef.current) {
      clearTimeout(silenceRef.current);
      silenceRef.current = null;
    }
  }, []);

  const flushFinalTranscript = useCallback(() => {
    clearDebounce();
    setFinalTranscript(cleanTranscript(finalBufferRef.current));
  }, [clearDebounce]);

  const scheduleFinalTranscript = useCallback(() => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      setFinalTranscript(cleanTranscript(finalBufferRef.current));
      debounceRef.current = null;
    }, DEBOUNCE_MS);
  }, [clearDebounce]);

  const resolveStop = useCallback(
    (value?: string) => {
      const resolved = cleanTranscript(value ?? finalBufferRef.current);
      const resolver = stopResolverRef.current;

      stopResolverRef.current = null;

      if (resolver) {
        resolver(resolved);
      }

      return resolved;
    },
    [],
  );

  const resetBuffers = useCallback(() => {
    finalBufferRef.current = "";
    lastFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentInterim = "";
      let nextFinal = finalBufferRef.current;

      clearSilenceTimer();

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = cleanTranscript(result[0]?.transcript ?? "");

        if (!text) continue;

        if (result.isFinal) {
          if (text.toLowerCase() === lastFinalRef.current.toLowerCase()) continue;

          nextFinal = mergeTranscript(nextFinal, text);
          lastFinalRef.current = text;
        } else {
          currentInterim = mergeTranscript(currentInterim, text);
        }
      }

      if (nextFinal !== finalBufferRef.current) {
        finalBufferRef.current = nextFinal;
        scheduleFinalTranscript();
      }

      setInterimTranscript(currentInterim);

      silenceRef.current = setTimeout(() => {
        setInterimTranscript("");
        flushFinalTranscript();
        silenceRef.current = null;
      }, SILENCE_MS);
    };

    recognition.onerror = () => {
      clearSilenceTimer();
      flushFinalTranscript();
      setInterimTranscript("");
      setIsListening(false);
      resolveStop();
    };

    recognition.onspeechend = () => {
      clearSilenceTimer();
      setInterimTranscript("");
      flushFinalTranscript();
    };

    recognition.onend = () => {
      clearSilenceTimer();
      flushFinalTranscript();
      setInterimTranscript("");
      setIsListening(false);
      resolveStop();
    };

    recognitionRef.current = recognition;

    return () => {
      clearDebounce();
      clearSilenceTimer();
      stopResolverRef.current = null;
      recognition.abort();
    };
  }, [SpeechRecognition, clearDebounce, clearSilenceTimer, flushFinalTranscript, resolveStop, scheduleFinalTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    clearDebounce();
    clearSilenceTimer();
    stopResolverRef.current = null;
    resetBuffers();

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {}
  }, [clearDebounce, clearSilenceTimer, resetBuffers]);

  const stopListening = useCallback(() => {
    return new Promise<string>((resolve) => {
      const currentTranscript = cleanTranscript(finalBufferRef.current);

      if (!recognitionRef.current || !isListening) {
        flushFinalTranscript();
        resolve(resolveStop(currentTranscript));
        return;
      }

      clearSilenceTimer();
      setInterimTranscript("");
      stopResolverRef.current = resolve;

      try {
        recognitionRef.current.stop();
      } catch {
        flushFinalTranscript();
        setIsListening(false);
        resolve(resolveStop(currentTranscript));
      }
    });
  }, [clearSilenceTimer, flushFinalTranscript, isListening, resolveStop]);

  const resetTranscript = useCallback(() => {
    clearDebounce();
    clearSilenceTimer();
    stopResolverRef.current = null;
    resetBuffers();
  }, [clearDebounce, clearSilenceTimer, resetBuffers]);

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
