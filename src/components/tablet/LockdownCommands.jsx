import React, { useState, useEffect } from 'react';
import { LOCKDOWN_COMMANDS } from '@/data/gameContent';
import SpeakButton from '@/components/comic/VoiceReader';

function pick(players) {
  const p = players[Math.floor(Math.random() * players.length)];
  const c = LOCKDOWN_COMMANDS[Math.floor(Math.random() * LOCKDOWN_COMMANDS.length)];
  return `${p?.name || 'Ηττημένη'}: ${c}`;
}

export default function LockdownCommands({ players }) {
  const [command, setCommand] = useState(() => pick(players));
  const [count, setCount] = useState(1);

  useEffect(() => {
    const t = setInterval(() => { setCommand(pick(players)); setCount((c) => c + 1); }, 15000);
    return () => clearInterval(t);
  }, [players]);

  return (
    <div className="comic-panel-sm bg-primary text-foreground p-4 mt-4 comic-pop" key={count}>
      <div className="text-xs font-bold">ΕΝΤΟΛΗ #{count} (νέα κάθε 15″)</div>
      <div className="font-heading text-2xl my-1">{command}</div>
      <SpeakButton text={command} label="🔊 ΕΚΦΩΝΗΣΗ" />
    </div>
  );
}