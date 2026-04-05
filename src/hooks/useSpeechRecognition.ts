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

const DEBOUNCE_MS = 450;
const SILENCE_MS = 1500;

interface SpeechRecognitionAlternativeLike {
  transcript?: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onspeechend: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeWord = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}'’-]+/gu, "");

const dedupeAdjacentWords = (value: string) => {
  const words = normalizeWhitespace(value).split(" ").filter(Boolean);

  return words
    .filter((word, index) => index === 0 || normalizeWord(word) !== normalizeWord(words[index - 1]))
    .join(" ");
};

const cleanTranscript = (value: string) => dedupeAdjacentWords(normalizeWhitespace(value));

const getWords = (value: string) => cleanTranscript(value).split(" ").filter(Boolean);

const getComparableWords = (value: string) =>
  cleanTranscript(value)
    .split(" ")
    .map(normalizeWord)
    .filter(Boolean);

const wordsMatch = (left: string[], right: string[]) =>
  left.length === right.length && left.every((word, index) => word === right[index]);

const getOrderedSegmentValues = (segments: Map<number, string>) =>
  [...segments.entries()].sort(([left], [right]) => left - right).map(([, value]) => value);

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

const buildTranscript = (segments: string[]) =>
  segments.reduce((transcript, segment) => mergeTranscript(transcript, segment), "");

const stripCommittedPrefix = (committed: string, incoming: string) => {
  const committedComparable = getComparableWords(committed);
  const incomingWords = getWords(incoming);
  const incomingComparable = incomingWords.map(normalizeWord).filter(Boolean);

  if (!committedComparable.length || !incomingComparable.length) {
    return cleanTranscript(incoming);
  }

  let overlap = 0;
  const maxOverlap = Math.min(committedComparable.length, incomingComparable.length);

  for (let size = maxOverlap; size > 0; size -= 1) {
    const committedSlice = committedComparable.slice(committedComparable.length - size);
    const incomingSlice = incomingComparable.slice(0, size);

    if (wordsMatch(committedSlice, incomingSlice)) {
      overlap = size;
      break;
    }
  }

  return cleanTranscript(incomingWords.slice(overlap).join(" "));
};

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalSegmentsRef = useRef(new Map<number, string>());
  const lastFinalTranscriptRef = useRef("");
  const lastCommittedTranscriptRef = useRef("");
  const pendingTranscriptRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolverRef = useRef<((value: string) => void) | null>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (((window as Window & {
          SpeechRecognition?: BrowserSpeechRecognitionConstructor;
          webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
        }).SpeechRecognition ||
          (window as Window & {
            SpeechRecognition?: BrowserSpeechRecognitionConstructor;
            webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
          }).webkitSpeechRecognition) ?? null)
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

  const getResolvedFinalTranscript = useCallback(() => {
    const transcript = buildTranscript(getOrderedSegmentValues(finalSegmentsRef.current));
    return cleanTranscript(transcript);
  }, []);

  const commitFinalTranscript = useCallback(
    (value: string) => {
      const cleaned = cleanTranscript(value);

      clearDebounce();
      pendingTranscriptRef.current = cleaned;

      if (cleaned !== lastCommittedTranscriptRef.current) {
        lastCommittedTranscriptRef.current = cleaned;
        setFinalTranscript(cleaned);
      }
    },
    [clearDebounce],
  );

  const flushFinalTranscript = useCallback((value?: string) => {
    const resolved = cleanTranscript(value ?? (pendingTranscriptRef.current || getResolvedFinalTranscript()));

    clearDebounce();

    if (resolved !== lastCommittedTranscriptRef.current) {
      lastCommittedTranscriptRef.current = resolved;
      setFinalTranscript(resolved);
    }

    pendingTranscriptRef.current = resolved;
    return resolved;
  }, [clearDebounce, getResolvedFinalTranscript]);

  const scheduleFinalTranscript = useCallback(
    (value: string) => {
      const cleaned = cleanTranscript(value);

      if (cleaned === lastFinalTranscriptRef.current) return;

      lastFinalTranscriptRef.current = cleaned;
      pendingTranscriptRef.current = cleaned;

    clearDebounce();
    debounceRef.current = setTimeout(() => {
        commitFinalTranscript(pendingTranscriptRef.current);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    },
    [clearDebounce, commitFinalTranscript],
  );

  const getLiveInterimTranscript = useCallback(() => {
    const resolvedFinal = pendingTranscriptRef.current || getResolvedFinalTranscript();
    return stripCommittedPrefix(resolvedFinal, interimTranscript);
  }, [getResolvedFinalTranscript, interimTranscript]);

  const resolveStop = useCallback(
    (value?: string) => {
      const resolved = flushFinalTranscript(value ?? getResolvedFinalTranscript());
      const resolver = stopResolverRef.current;

      stopResolverRef.current = null;

      if (resolver) {
        resolver(resolved);
      }

      return resolved;
    },
    [flushFinalTranscript, getResolvedFinalTranscript],
  );

  const resetBuffers = useCallback(() => {
    finalSegmentsRef.current.clear();
    lastFinalTranscriptRef.current = "";
    lastCommittedTranscriptRef.current = "";
    pendingTranscriptRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const interimSegments: string[] = [];

      clearSilenceTimer();

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = cleanTranscript(result[0]?.transcript ?? "");

        if (!text) continue;

        if (result.isFinal) {
          finalSegmentsRef.current.set(i, text);
        } else {
          interimSegments.push(text);
        }
      }

      const nextFinalTranscript = getResolvedFinalTranscript();
      scheduleFinalTranscript(nextFinalTranscript);

      const nextInterimTranscript = stripCommittedPrefix(
        nextFinalTranscript,
        buildTranscript(interimSegments),
      );

      setInterimTranscript(nextInterimTranscript);

      silenceRef.current = setTimeout(() => {
        setInterimTranscript("");
        flushFinalTranscript(nextFinalTranscript);
        silenceRef.current = null;
      }, SILENCE_MS);
    };

    recognition.onerror = () => {
      clearSilenceTimer();
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
    if (!recognitionRef.current || isListening) return;

    clearDebounce();
    clearSilenceTimer();
    stopResolverRef.current = null;
    resetBuffers();

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {}
  }, [clearDebounce, clearSilenceTimer, isListening, resetBuffers]);

  const stopListening = useCallback(() => {
    return new Promise<string>((resolve) => {
      const currentTranscript = flushFinalTranscript(getResolvedFinalTranscript());

      if (!recognitionRef.current || !isListening) {
        resolve(resolveStop(currentTranscript));
        return;
      }

      clearSilenceTimer();
      setInterimTranscript("");
      stopResolverRef.current = resolve;

      try {
        recognitionRef.current.stop();
      } catch {
        setIsListening(false);
        resolve(resolveStop(currentTranscript));
      }
    });
  }, [clearSilenceTimer, flushFinalTranscript, getResolvedFinalTranscript, isListening, resolveStop]);

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
