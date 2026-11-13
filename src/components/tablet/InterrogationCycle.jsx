import React, { useState, useEffect, useRef } from 'react';

// EP-03: Chair Bound Interrogation — random question/tickle/ice prompts in darkness
const PROMPTS = [
  { icon: '❓', text: 'Ερώτηση: Ποιο είναι το μεγαλύτερο μυστικό σου;', type: 'question' },
  { icon: '🤚', text: 'Γαργάλημα στα πλευρά!', type: 'tickle' },
  { icon: '🧊', text: 'Παγάκι στον λαιμό!', type: 'ice' },
  { icon: '❓', text: 'Ερώτηση: Τι έκανες χθες βράδυ;', type: 'question' },
  { icon: '🦶', text: 'Γαργάλημα στις πατούσες!', type: 'tickle' },
  { icon: '🧊', text: 'Παγάκι στην πατούσα!', type: 'ice' },
  { icon: '❓', text: 'Ερώτηση: Ποια φίλη θα προδώσεις;', type: 'question' },
  { icon: '🤚', text: 'Γαργάλημα στις μασχάλες!', type: 'tickle' },
];

export default function InterrogationCycle({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const intervalRef = useRef(null);
  const cycleRef = useRef(null);

  useEffect(() => {
    if (!frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(intervalRef.current); clearInterval(cycleRef.current); onComplete?.({}); return 0; }
          return p - 0.1;
        });
      }, 100);
      cycleRef.current = setInterval(() => {
        setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
      }, ultra ? 4000 : 6000);
    } else { clearInterval(intervalRef.current); clearInterval(cycleRef.current); }
    return () => { clearInterval(intervalRef.current); clearInterval(cycleRef.current); };
  }, [frozen]);

  const isDark = true; // blackout mode
  const colorMap = { question: 'text-tarot-teal', tickle: 'text-destructive', ice: 'text-tarot-teal' };

  return (
    <div className={`text-center space-y-3 rounded-xl p-4 ${isDark ? 'bg-background' : 'bg-background'}`}>
      <div className="font-heading text-5xl text-primary">{Math.ceil(remaining)}″</div>
      <div className="text-xs text-foreground/50">🌑 BLACKOUT — Απόλυτο σκοτάδι{ultra ? ' + Earplugs' : ''}</div>
      <div className={`text-2xl font-bold comic-pop ${colorMap[prompt.type]}`} key={prompt.text}>
        {prompt.icon} {prompt.text}
      </div>
      <div className="text-xs text-foreground/70">
        {ultra ? 'ULTRA: Τυχαίο παγάκι κάθε 30″ — δεν ξέρεις τι έρχεται' : 'Δεν ξέρεις ποιος από πού έρχεται'}
      </div>
    </div>
  );
}