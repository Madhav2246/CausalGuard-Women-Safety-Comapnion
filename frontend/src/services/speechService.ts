type SpeechRecognition = any;

const SpeechRecognitionClass =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

let recognitionInstance: any = null;

// Multi-language locale map
const LANG_LOCALE_MAP: Record<string, string> = {
  English: "en-US",
  Hindi: "hi-IN",
  Telugu: "te-IN",
  Tamil: "ta-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Marathi: "mr-IN",
  Bengali: "bn-IN",
};

export const speechService = {
  speak(text: string, language: string = "English"): Promise<void> {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        console.warn("Speech synthesis is not supported in this browser.");
        resolve();
        return;
      }

      // Prevent overlapping speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const locale = LANG_LOCALE_MAP[language] || "en-US";
      utterance.lang = locale;

      // Try to find matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) => v.lang.startsWith(locale) || v.lang.includes(locale.split("-")[0])
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  },

  stop() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  },

  startListening(
    language: string,
    onResult: (text: string) => void,
    onEnd: () => void,
    onError?: (err: Error) => void
  ) {
    if (!SpeechRecognitionClass) {
      if (onError) onError(new Error("Browser Speech Recognition is not supported."));
      return;
    }

    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }

    const rec = new SpeechRecognitionClass();
    recognitionInstance = rec;

    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = LANG_LOCALE_MAP[language] || "en-US";

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      onResult(resultText);
    };

    rec.onend = () => {
      if (recognitionInstance === rec) {
        recognitionInstance = null;
      }
      onEnd();
    };

    rec.onerror = (event: any) => {
      if (onError) {
        onError(new Error(event.error || "Speech recognition error"));
      }
    };

    rec.start();
  },

  stopListening() {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
      recognitionInstance = null;
    }
  }
};
