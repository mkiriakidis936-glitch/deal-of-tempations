mport React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function Timer({
  duration,
  running,
  onComplete,
  label,
  variant = 'yellow',
  size = 'md',
  frozen = false,
}) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => { setRemaining(duration); }, [duration]);

  useEffect(() => {
    if (running && !frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 0.1) {
            clearInterval(intervalRef.current);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, frozen]);

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const isDanger = remaining <= 10 && remaining > 0;
  const sizeClass = size === 'lg' ? 'text-6xl' : size === 'sm' ? 'text-2xl' : 'text-4xl';
  const colorClass = isDanger ? 'text-destructive comic-pulse' : variant === 'cyan' ? 'text-tarot-teal' : 'text-foreground';

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <div className="font-heading text-lg uppercase tracking-wide text-foreground">{label}</div>}
      <div className={cn('font-heading', sizeClass, colorClass)}>
        {Math.ceil(remaining)}″
      </div>
      <div className="w-full h-3 bg-foreground/10 rounded-full overflow-hidden border-2 border-border">
        <div
          className={cn('h-full rounded-full transition-all', isDanger ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}