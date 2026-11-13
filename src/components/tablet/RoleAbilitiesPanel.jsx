import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { HIDDEN_ROLES } from '@/data/gameConfig';
import { useRoleAbility as applyRoleAbility, addHistory } from '@/lib/gameLogic';

export default function RoleAbilitiesPanel({ state, updateState }) {
  const [open, setOpen] = useState(false);
  const [driverTarget, setDriverTarget] = useState(null);

  async function handleUse(playerId, payload) {
    const result = applyRoleAbility(state, playerId, payload);
    if (!result) return;
    const player = state.players.find((p) => p.id === playerId);
    const role = HIDDEN_ROLES.find((r) => r.id === player.role);
    const history = addHistory({ ...state, ...result }, { type: 'role_ability', player: player.name, role: role?.name });
    await updateState({ ...result, history });
    setOpen(false);
    setDriverTarget(null);
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} className="comic-panel-sm px-3 py-1.5 text-sm font-bold bg-tarot-royal/30 text-foreground">
        🎭 ΙΚΑΝΟΤΗΤΕΣ
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-background/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <ComicPanel className="bg-card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-heading text-xl mb-3 text-center text-primary">🎭 ΚΡΥΦΕΣ ΙΚΑΝΟΤΗΤΕΣ (1× ανά παρτίδα)</div>
            <div className="space-y-2">
              {state.players.map((p) => {
                const role = HIDDEN_ROLES.find((r) => r.id === p.role);
                if (!role) return null;
                const used = p.abilityUsed;
                return (
                  <div key={p.id} className={`comic-panel-sm p-2 ${used ? 'bg-secondary opacity-60' : 'bg-tarot-royal/20'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{role.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-foreground">{p.name} — {role.name}</div>
                        <div className="text-xs text-foreground/70 font-body">{role.desc}</div>
                      </div>
                      {used && <span className="text-xs font-bold text-foreground/50">ΧΡΗΣΙΜΟΠΟΙΗΘΗΚΕ</span>}
                    </div>
                    {!used && (
                      <div className="mt-2">
                        {p.role === 'cop' && (
                          <ComicButton variant="dark" size="sm" onClick={() => handleUse(p.id, {})}>
                            🔮 ΠΡΟΒΛΕΨΕ MOST WANTED
                          </ComicButton>
                        )}
                        {p.role === 'hacker' && (
                          <ComicButton variant="dark" size="sm" onClick={() => handleUse(p.id, {})}>
                            💻 ΑΚΥΡΩΣΕ ΣΦΑΛΜΑ / BLACKOUT
                          </ComicButton>
                        )}
                        {p.role === 'driver' && (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-foreground">Διάλεξε συμπαίκτρια για διάσωση:</div>
                            <div className="flex flex-wrap gap-1">
                              {state.players.filter((x) => x.id !== p.id && x.penaltyStep > 0).map((t) => (
                                <button key={t.id} onClick={() => setDriverTarget(t.id)} className={`text-xs px-2 py-1 border-2 border-border rounded ${driverTarget === t.id ? 'bg-primary/20' : 'bg-secondary'} text-foreground`}>
                                  {t.name} ({t.penaltyStep})
                                </button>
                              ))}
                            </div>
                            <ComicButton variant="dark" size="sm" onClick={() => driverTarget && handleUse(p.id, { targetId: driverTarget })} disabled={!driverTarget}>
                              🏎️ ΔΙΑΣΩΣΗ
                            </ComicButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-3">
              <ComicButton variant="white" size="sm" onClick={() => setOpen(false)}>ΚΛΕΙΣΙΜΟ</ComicButton>
            </div>
          </ComicPanel>
        </div>
      )}
    </>
  );
}