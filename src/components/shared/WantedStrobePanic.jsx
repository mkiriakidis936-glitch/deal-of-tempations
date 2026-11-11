import { useEffect, useState } from 'react';

export default function WantedStrobePanic({ wantedLevel, playerName }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (wantedLevel >= 5) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [wantedLevel, playerName]);

  if (wantedLevel < 5) return null;

  return (
    <>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm comic-slide-in">
          <div className="text-center">
            <div className="ds-eyebrow text-destructive">Κατάσταση συναγερμού</div>
            <h1 className="ds-title mt-3 text-6xl text-destructive">Καταζήτηση 5</h1>
            <div className="ds-rule mx-auto mt-6 w-32" />
            <div className="ds-label mt-6 text-primary/80">Πανικός</div>
            <div className="ds-value mt-3 text-xl text-foreground">{playerName}</div>
            <div className="ds-lede mt-2 text-sm">Μεγαλύτερη καταζήτηση — προσοχή.</div>
          </div>
        </div>
      )}
    </>
  );
}