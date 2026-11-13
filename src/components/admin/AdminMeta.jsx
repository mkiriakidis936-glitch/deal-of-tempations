import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminAchievementDefinitions from '@/components/admin/AdminAchievementDefinitions';

const SUB_TABS = [
  { id: 'chronicle', label: '📜 Chronicle' },
  { id: 'archives', label: '📦 Archives' },
  { id: 'vault', label: '🗝️ Vault' },
  { id: 'hauntings', label: '👻 Hauntings' },
  { id: 'memorials', label: '🕯️ Memorials' },
  { id: 'profiles', label: '👤 Profiles' },
  { id: 'achievements', label: '🏅 Achievements' },
];

export default function AdminMeta({ initialTab = 'chronicle' }) {
  const [subTab, setSubTab] = useState(initialTab);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let items = [];
      if (subTab === 'chronicle') {
        const res = await base44.entities.Chronicle.filter({}, { sort: '-chapter', limit: 100 });
        items = res.items || [];
      } else if (subTab === 'archives') {
        const res = await base44.entities.SessionArchive.filter({}, { sort: '-created_date', limit: 100 });
        items = res.items || [];
      } else if (subTab === 'vault') {
        const res = await base44.entities.BlackmailVault.filter({}, { sort: '-created_date', limit: 100 });
        items = res.items || [];
      } else if (subTab === 'hauntings') {
        const res = await base44.entities.Haunting.filter({}, { sort: '-created_date', limit: 100 });
        items = res.items || [];
      } else if (subTab === 'memorials') {
        const res = await base44.entities.Memorial.filter({}, { sort: '-created_date', limit: 100 });
        items = res.items || [];
      } else if (subTab === 'profiles') {
        const res = await base44.entities.PlayerProfile.filter({}, { sort: '-created_date', limit: 100 });
        items = res.items || [];
      } else if (subTab === 'achievements') {
        const res = await base44.entities.Achievement.filter({}, { sort: '-created_date', limit: 200 });
        items = res.items || [];
      }
      setData(items);
    } catch (e) {
      console.error('Meta load error', e);
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => { load(); }, [load, subTab]);

  async function handleDelete(id) {
    const entityMap = {
      chronicle: 'Chronicle', archives: 'SessionArchive', vault: 'BlackmailVault',
      hauntings: 'Haunting', memorials: 'Memorial', profiles: 'PlayerProfile', achievements: 'Achievement',
    };
    try {
      await base44.entities[entityMap[subTab]].delete(id);
      setData((prev) => prev.filter((d) => d.id !== id));
    } catch (e) { console.error('Delete error', e); }
  }

  async function handleToggleRedeemed(entry) {
    try {
      await base44.entities.BlackmailVault.update(entry.id, { redeemed: !entry.redeemed });
      setData((prev) => prev.map((d) => d.id === entry.id ? { ...d, redeemed: !entry.redeemed } : d));
    } catch (e) { console.error('Update error', e); }
  }

  async function handleUpdateProfile(profile, field, value) {
    try {
      await base44.entities.PlayerProfile.update(profile.id, { [field]: value });
      setData((prev) => prev.map((d) => d.id === profile.id ? { ...d, [field]: value } : d));
    } catch (e) { console.error('Update error', e); }
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-secondary">
        <div className="font-heading text-xl text-primary mb-1">🔮 META-GAME MANAGEMENT</div>
        <div className="text-xs text-foreground/60">Chronicle · Archives · Vault · Hauntings · Memorials · Profiles · Achievements</div>
      </ComicPanel>

      <div className="flex gap-2 flex-wrap">
        {SUB_TABS.map((t) => (
          <ComicButton key={t.id} variant={subTab === t.id ? 'magenta' : 'white'} size="sm" onClick={() => setSubTab(t.id)}>
            {t.label}
          </ComicButton>
        ))}
      </div>

      {loading && <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ...</div></ComicPanel>}

      {!loading && subTab === 'chronicle' && (
        <div className="space-y-2">
          {data.length === 0 && <EmptyState icon="📜" text="Κανένα κεφάλαιο" />}
          {data.map((ch) => (
            <ComicPanel key={ch.id} className="bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-primary font-bold">VOL.{ch.volume} · ΚΕΦ.{ch.chapter}</div>
                  <div className="font-heading text-lg truncate">{ch.title}</div>
                  <div className="text-xs text-foreground/50 truncate">{ch.content?.slice(0, 100)}...</div>
                </div>
                <ComicButton variant="red" size="sm" onClick={() => handleDelete(ch.id)}>🗑️</ComicButton>
              </div>
            </ComicPanel>
          ))}
        </div>
      )}

      {!loading && subTab === 'archives' && (
        <div className="space-y-2">
          {data.length === 0 && <EmptyState icon="📦" text="Καμία αρχειοθετημένη συνεδρία" />}
          {data.map((a) => (
            <ComicPanel key={a.id} className="bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg">{a.sessionCode}</span>
                    {a.sessionCode?.startsWith('GHOST-') && <span className="text-xs">👻</span>}
                    <span className="text-xs bg-primary/20 px-1.5 rounded">{a.mode}</span>
                  </div>
                  <div className="text-sm text-foreground/70">🏆 {a.winner || '—'}</div>
                  <div className="text-xs text-foreground/50">👥 {(a.playerNames || []).join(', ') || '—'}</div>
                  <div className="text-xs text-foreground/40">{a.eventDate} · {(a.confessions || []).length} confessions · {(a.highlights || []).length} highlights</div>
                </div>
                <ComicButton variant="red" size="sm" onClick={() => handleDelete(a.id)}>🗑️</ComicButton>
              </div>
            </ComicPanel>
          ))}
        </div>
      )}

      {!loading && subTab === 'vault' && (
        <div className="space-y-2">
          {data.length === 0 && <EmptyState icon="🗝️" text="Καμία confession" />}
          {data.map((v) => (
            <ComicPanel key={v.id} className={`bg-card p-3 ${v.redeemed ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading">{v.playerName}</span>
                    <span className="text-xs bg-primary/20 px-1.5 rounded">{v.confessionType}</span>
                    <span className="text-xs text-primary">🪙 {v.tokenCost || 100}</span>
                  </div>
                  <div className="text-sm text-foreground/70 italic truncate">{v.confession}</div>
                  <div className="text-xs text-foreground/40">{v.sessionCode}</div>
                </div>
                <div className="flex gap-1">
                  <ComicButton variant="green" size="sm" onClick={() => handleToggleRedeemed(v)}>
                    {v.redeemed ? '↩️' : '✓'}
                  </ComicButton>
                  <ComicButton variant="red" size="sm" onClick={() => handleDelete(v.id)}>🗑️</ComicButton>
                </div>
              </div>
            </ComicPanel>
          ))}
        </div>
      )}

      {!loading && subTab === 'hauntings' && (
        <div className="space-y-2">
          {data.length === 0 && <EmptyState icon="👻" text="Καμία κατάρα" />}
          {data.map((h) => (
            <ComicPanel key={h.id} className="bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-heading">{h.playerName}</div>
                  <div className="text-sm text-foreground/70 italic">{h.message}</div>
                  <div className="text-xs text-foreground/40">{h.sessionCode} · {h.eventDate}</div>
                </div>
                <ComicButton variant="red" size="sm" onClick={() => handleDelete(h.id)}>🗑️</ComicButton>
              </div>
            </ComicPanel>
          ))}
        </div>
      )}

      {!loading && subTab === 'memorials' && (
        <div className="space-y-2">
          {data.length === 0 && <EmptyState icon="🕯️" text="Κανένα μνημείο" />}
          {data.map((m) => (
            <ComicPanel key={m.id} className="bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-heading">{m.identityName} <span className="text-xs text-foreground/40">({m.playerName})</span></div>
                  <div className="text-sm text-foreground/70 italic truncate">{m.epitaph}</div>
                  <div className="text-xs text-foreground/40">#{m.lifeNumber} · {m.archetype} · {m.causeOfDeath}</div>
                </div>
                <ComicButton variant="red" size="sm" onClick={() => handleDelete(m.id)}>🗑️</ComicButton>
              </div>
            </ComicPanel>
          ))}
        </div>
      )}

      {!loading && subTab === 'profiles' && (
        <div className="space-y-2">
          {data.length === 0 && <EmptyState icon="👤" text="Κανένα profile" />}
          {data.map((p) => (
            <ComicPanel key={p.id} className="bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-heading text-lg">{p.playerName}</div>
                  {p.identityName && <div className="text-xs text-primary">🎭 {p.identityName} ({p.identityArchetype || '—'})</div>}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span>🎮 {p.totalSessions || 0} sessions</span>
                    <span>🏆 {p.totalWins || 0} wins</span>
                    <span>💰 <input type="number" value={p.wallet || 0} className="w-16 bg-background/30 border border-border rounded px-1" onChange={(e) => handleUpdateProfile(p, 'wallet', Number(e.target.value))} /></span>
                    <span>⚖️ <input type="number" value={p.karma || 0} className="w-16 bg-background/30 border border-border rounded px-1" onChange={(e) => handleUpdateProfile(p, 'karma', Number(e.target.value))} /></span>
                    <span>🪙 {p.blackmailTokens || 0}</span>
                    <span>{p.isAlive ? '💚' : '💀'}</span>
                  </div>
                </div>
                <ComicButton variant="red" size="sm" onClick={() => handleDelete(p.id)}>🗑️</ComicButton>
              </div>
            </ComicPanel>
          ))}
        </div>
      )}

      {!loading && subTab === 'achievements' && (
        <div className="space-y-3">
        <AdminAchievementDefinitions />
        <div className="space-y-2">
          {data.length === 0 && <EmptyState icon="🏅" text="Κανένα achievement ακόμα" />}
          {data.map((a) => (
            <ComicPanel key={a.id} className="bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-lg">{a.icon} {a.achievementName}</div>
                  <div className="text-sm text-foreground/70">{a.playerName}</div>
                  {a.reward && <div className="text-xs text-primary mt-1">Ανταμοιβή: {a.reward}</div>}
                  <div className="text-xs text-foreground/40">{a.sessionCode}</div>
                </div>
                <ComicButton variant="red" size="sm" onClick={() => handleDelete(a.id)}>🗑️</ComicButton>
              </div>
            </ComicPanel>
          ))}
        </div>
        </div>
      )}

    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <ComicPanel className="bg-card text-center py-8">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-foreground/50 italic">{text}</div>
    </ComicPanel>
  );
}