import { useState, useCallback } from 'react';

// Ανάγνωση κειμένου με τη φωνή της συσκευής — χωρίς AI, χωρίς εξωτερικές κλήσεις.
function browserTTS(text, opts, setSpeaking) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang || 'el-GR';
  u.rate = opts.rate || 1;
  u.pitch = opts.pitch || 1;
  u.volume = opts.volume || 1;
  u.onstart = () => setSpeaking(true);
  u.onend = () => setSpeaking(false);
  u.onerror = () => setSpeaking(false);
  window.speechSynthesis.speak(u);
}

export function useVoiceReader() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text, opts = {}) => {
    if (!text) return;
    browserTTS(text, opts, setSpeaking);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, loading: false };
}

export default function SpeakButton({ text, label = '🔊', className = '' }) {
  const { speak, stop, speaking } = useVoiceReader();
  return (
    <button
      onClick={() => (speaking ? stop() : speak(text))}
      className={`comic-boom font-heading px-3 py-1.5 text-sm ${speaking ? 'bg-destructive text-foreground' : 'bg-background text-primary'} ${className}`}
    >
      {speaking ? '⏹ STOP' : label}
    </button>
  );
}