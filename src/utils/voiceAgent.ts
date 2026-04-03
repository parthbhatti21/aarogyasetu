/**
 * Browser Web Speech API: text-to-speech and speech-to-text for the voice agent.
 * Uses regional BCP-47 tags (e.g. hi-IN, ta-IN) for Indian languages.
 */

/** After this many ms without new speech, we treat input as complete (auto-send in intake chat). */
export const DEFAULT_VOICE_SILENCE_MS = 3000;

export const VOICE_LOCALES: { code: string; label: string }[] = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'or-IN', label: 'Odia' },
];

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition);
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

export function speakText(text: string, lang: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      reject(new Error('Text-to-speech is not supported in this browser.'));
      return;
    }

    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) {
      resolve();
      return;
    }

    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cleaned);
      utter.lang = lang;
      utter.rate = 0.95;
      utter.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const primary = voices.find((v) => v.lang === lang);
      const fallback = primary || voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
      if (fallback) utter.voice = fallback;
      utter.onend = () => resolve();
      utter.onerror = () => reject(new Error('Speech playback failed.'));
      window.speechSynthesis.speak(utter);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', run, { once: true });
      window.setTimeout(run, 800);
    } else {
      run();
    }
  });
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export type SpeechRecognitionResultHandler = (transcript: string) => void;

export function startListening(
  lang: string,
  onResult: SpeechRecognitionResultHandler,
  onError: (message: string) => void
): (() => void) | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    onError('Voice input is not supported in this browser.');
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: Event) => {
    const results = (event as unknown as { results: { [key: number]: { [key: number]: { transcript: string } } } })
      .results;
    const text = results[0]?.[0]?.transcript?.trim() ?? '';
    if (text) onResult(text);
  };

  recognition.onerror = (event: Event) => {
    const err = (event as unknown as { error?: string }).error;
    if (err === 'aborted' || err === 'no-speech') return;
    onError(`Voice input error: ${err || 'unknown'}`);
  };

  try {
    recognition.start();
  } catch {
    onError('Could not start microphone.');
    return null;
  }

  return () => {
    try {
      recognition.abort();
    } catch {
      /* ignore */
    }
  };
}

export type ContinuousListenOptions = {
  /** Milliseconds after the last speech result before `onSilence` fires (default 3000). */
  silenceMs?: number;
  /** Live transcript (final + interim) while the user speaks. */
  onTranscriptUpdate: (text: string) => void;
  /** Called once after `silenceMs` with no new results; non-empty text only. */
  onSilence: (finalText: string) => void;
  onError: (message: string) => void;
};

/**
 * Continuous dictation: keeps the mic open, streams transcript updates, and fires `onSilence`
 * after ~`silenceMs` without new speech (e.g. auto-send the message).
 */
export function startContinuousListeningWithSilence(
  lang: string,
  options: ContinuousListenOptions
): (() => void) | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    options.onError('Voice input is not supported in this browser.');
    return null;
  }

  const silenceMs = options.silenceMs ?? DEFAULT_VOICE_SILENCE_MS;
  let active = true;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastDisplay = '';

  const clearSilenceTimer = () => {
    if (silenceTimer !== null) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  const scheduleSilence = () => {
    clearSilenceTimer();
    silenceTimer = window.setTimeout(() => {
      silenceTimer = null;
      const text = lastDisplay.trim();
      if (!text || !active) return;
      active = false;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      options.onSilence(text);
    }, silenceMs);
  };

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: Event) => {
    const ev = event as unknown as SpeechRecognitionEvent;
    let interim = '';
    let final = '';
    for (let i = 0; i < ev.results.length; i++) {
      const res = ev.results[i];
      const t = res[0]?.transcript ?? '';
      if (res.isFinal) {
        final += t;
      } else {
        interim += t;
      }
    }
    lastDisplay = (final + interim).trim();
    options.onTranscriptUpdate(lastDisplay);
    scheduleSilence();
  };

  recognition.onerror = (event: Event) => {
    const err = (event as unknown as { error?: string }).error;
    if (err === 'aborted' || err === 'no-speech') return;
    options.onError(`Voice input error: ${err || 'unknown'}`);
  };

  recognition.onend = () => {
    if (!active) return;
    try {
      recognition.start();
    } catch {
      /* may already be starting */
    }
  };

  try {
    recognition.start();
  } catch {
    options.onError('Could not start microphone.');
    return null;
  }

  return () => {
    active = false;
    clearSilenceTimer();
    try {
      recognition.abort();
    } catch {
      /* ignore */
    }
  };
}
