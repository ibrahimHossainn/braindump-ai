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
const MAX_OVERLAP_WORDS = 12;

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

function normalizeForCompare(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function dedupeAdjacent(text: string): string {
  const words = splitWords(text);
  const result: string[] = [];

  for (const word of words) {
    if (result.length === 0 || word.toLowerCase() !== result[result.length - 1].toLowerCase()) {
      result.push(word);
    }
  }

  return result.join(" ");
}

function dedupeRepeatedPhrases(text: string): string {
  let result = text;

  for (let n = 5; n >= 2; n--) {
    const words = splitWords(result);
    const out: string[] = [];
    let i = 0;

    while (i < words.length) {
      if (i + n * 2 <= words.length) {
        const phrase = words.slice(i, i + n).map((word) => word.toLowerCase()).join(" ");
        const nextPhrase = words.slice(i + n, i + n * 2).map((word) => word.toLowerCase()).join(" ");

        if (phrase === nextPhrase) {
          out.push(...words.slice(i, i + n));
          i += n * 2;

          while (i + n <= words.length) {
            const repeatedPhrase = words.slice(i, i + n).map((word) => word.toLowerCase()).join(" ");
            if (repeatedPhrase === phrase) {
              i += n;
            } else {
              break;
            }
          }

          continue;
        }
      }

      out.push(words[i]);
      i += 1;
    }

    result = out.join(" ");
  }

  return result;
}

function cleanFinal(text: string): string {
  return dedupeRepeatedPhrases(dedupeAdjacent(text.replace(/\s+/g, " ").trim()));
}

function mergeTranscript(base: string, incoming: string): string {
  const cleanBase = cleanFinal(base);
  const cleanIncoming = cleanFinal(incoming);

  if (!cleanBase) return cleanIncoming;
  if (!cleanIncoming) return cleanBase;

  const baseNormalized = normalizeForCompare(cleanBase);
  const incomingNormalized = normalizeForCompare(cleanIncoming);

  if (!incomingNormalized || baseNormalized === incomingNormalized || baseNormalized.includes(incomingNormalized)) {
    return cleanBase;
  }

  if (incomingNormalized.startsWith(baseNormalized) || incomingNormalized.includes(baseNormalized)) {
    return cleanIncoming;
  }

  const baseWords = splitWords(cleanBase);
  const incomingWords = splitWords(cleanIncoming);
  const maxOverlap = Math.min(MAX_OVERLAP_WORDS, baseWords.length, incomingWords.length);

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const baseSuffix = normalizeForCompare(baseWords.slice(-overlap).join(" "));
    const incomingPrefix = normalizeForCompare(incomingWords.slice(0, overlap).join(" "));

    if (baseSuffix && baseSuffix === incomingPrefix) {
      const suffix = incomingWords.slice(overlap).join(" ");
      return cleanFinal([cleanBase, suffix].filter(Boolean).join(" "));
    }
  }

  return cleanFinal(`${cleanBase} ${cleanIncoming}`);
}

function buildInterimText(finalText: string, interimText: string): string {
  const cleanInterim = cleanFinal(interimText);
  if (!cleanInterim) return "";

  const merged = mergeTranscript(finalText, cleanInterim);
  const mergedWords = splitWords(merged);
  const finalWords = splitWords(cleanFinal(finalText));

  if (mergedWords.length <= finalWords.length) return "";

  return cleanFinal(mergedWords.slice(finalWords.length).join(" "));
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolverRef = useRef<((value: string) => void) | null>(null);
  const isListeningRef = useRef(false);
  const lastFinalTranscriptRef = useRef("");

  const SpeechRecognition =
    typeof window !== "undefined"
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ?? null
      : null;

  const isSupported = !!SpeechRecognition;

  const queueTranscriptUpdate = useCallback((text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setFinalTranscript(cleanFinal(text));
      debounceRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  const commitFinal = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const text = cleanFinal(lastFinalTranscriptRef.current);
    lastFinalTranscriptRef.current = text;
    setFinalTranscript(text);
    setInterimTranscript("");
    return text;
  }, []);

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
      let nextFinal = lastFinalTranscriptRef.current;
      let nextInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = cleanFinal(result[0]?.transcript ?? "");

        if (!text) continue;

        if (result.isFinal) {
          const mergedFinal = mergeTranscript(nextFinal, text);
          if (normalizeForCompare(mergedFinal) !== normalizeForCompare(nextFinal)) {
            nextFinal = mergedFinal;
          }
          nextInterim = "";
        } else {
          nextInterim = buildInterimText(nextFinal, text);
        }
      }

      lastFinalTranscriptRef.current = cleanFinal(nextFinal);
      queueTranscriptUpdate(lastFinalTranscriptRef.current);
      setInterimTranscript(nextInterim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setIsListening(false);
      isListeningRef.current = false;
      resolveStop();
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore restart races from the browser implementation.
        }
        return;
      }

      setIsListening(false);
      resolveStop();
    };

    recognitionRef.current = recognition;

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      stopResolverRef.current = null;
      recognition.abort();
    };
  }, [SpeechRecognition, queueTranscriptUpdate, resolveStop]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;

    lastFinalTranscriptRef.current = "";
    stopResolverRef.current = null;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    setFinalTranscript("");
    setInterimTranscript("");

    try {
      recognitionRef.current.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch {
      // Ignore duplicate start attempts.
    }
  }, []);

  const stopListening = useCallback(() => {
    return new Promise<string>((resolve) => {
      isListeningRef.current = false;
      setInterimTranscript("");

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
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    lastFinalTranscriptRef.current = "";
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
