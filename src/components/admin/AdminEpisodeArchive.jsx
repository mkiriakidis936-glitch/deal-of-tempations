import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES } from '@/data/gameConfig';

const MODE_NAMES = Object.fromEntries(GAME_MODES.map((mode) => [mode.id, mode.name]));
const dateLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('el-GR');
};

export default function AdminEpisodeArchive() {
  const [archives, setArchives] = useState([]);
  const [chronicles, setChronicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [archiveResult, chronicleResult] = await Promise.all([
        base44.entities.SessionArchive.filter({}, { sort: '-created_date', limit: 100 }),
        base44.entities.Chronicle.filter({}, { sort: '-created_date', limit: 100 }),
      ]);
      setArchives(archiveResult.items || []);
      setChronicles(chronicleResult.items || []);
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκε το αρχείο επεισοδίων.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ ΑΡΧΕΙΟΥ ΕΠΕΙΣΟΔΙΩΝ…</div></ComicPanel>;
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-secondary">
        <div className="font-heading text-xl text-primary">🎬 EPISODE ARCHIVE</div>
        <p className="mt-1 text-xs text-foreground/65">Αποτελέσματα, παίκτριες, highlights, σκηνές Show Director και πρόγραμμα κάθε ολοκληρωμένου επεισοδίου.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-background/60 px-3 py-2 text-xs font-bold">{archives.length} επεισόδια</span>
          <span className="rounded-lg bg-background/60 px-3 py-2 text-xs font-bold">{chronicles.length} κεφάλαια Chronicle</span>
          <ComicButton size="sm" variant="dark" onClick={load}>↻ Ανανέωση</ComicButton>
        </div>
      </ComicPanel>

      {message && <ComicPanel className="bg-tarot-crimson"><div className="text-sm">{message}</div></ComicPanel>}

      {archives.length === 0 ? (
        <ComicPanel className="bg-card text-center py-8">
          <div className="font-heading text-lg">Δεν υπάρχουν αρχειοθετημένα επεισόδια</div>
          <div className="mt-1 text-xs text-foreground/55">Τα ολοκληρωμένα παιχνίδια θα εμφανίζονται εδώ μετά την αρχειοθέτησή τους.</div>
        </ComicPanel>
      ) : archives.map((archive) => {
        const scenes = Array.isArray(archive.showScenes) ? archive.showScenes : [];
        const schedule = Array.isArray(archive.episodeSchedule) ? archive.episodeSchedule : [];
        const players = Array.isArray(archive.playerNames) ? archive.playerNames : [];
        const highlights = Array.isArray(archive.highlights) ? archive.highlights : [];
        const stats = archive.stats && typeof archive.stats === 'object' ? Object.entries(archive.stats) : [];
        const open = expanded === archive.id;
        return (
          <ComicPanel key={archive.id} className="bg-card space-y-3">
            <button type="button" onClick={() => setExpanded(open ? null : archive.id)} className="w-full flex items-start justify-between gap-3 text-left">
              <span className="min-w-0">
                <span className="block font-heading text-lg">{MODE_NAMES[archive.mode] || archive.mode || 'Game Show'}</span>
                <span className="block text-xs text-foreground/60">{dateLabel(archive.eventDate || archive.created_date)} · {archive.sessionCode || '—'}</span>
                <span className="mt-1 block text-xs text-foreground/75">Νικήτρια: <strong>{archive.winner || '—'}</strong></span>
              </span>
              <span className="shrink-0 text-xs font-bold">{open ? '▲ ΚΛΕΙΣΙΜΟ' : '▼ ΛΕΠΤΟΜΕΡΕΙΕΣ'}</span>
            </button>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-background/60 px-2 py-1">👥 {players.length} παίκτριες</span>
              <span className="rounded bg-background/60 px-2 py-1">🎬 {scenes.length} σκηνές</span>
              <span className="rounded bg-background/60 px-2 py-1">✨ {highlights.length} highlights</span>
            </div>

            {open && (
              <div className="space-y-4 border-t border-border/40 pt-3">
                <div>
                  <div className="mb-2 text-xs font-bold text-primary">CAST</div>
                  <div className="flex flex-wrap gap-2">
                    {players.map((name) => <span key={name} className="rounded bg-secondary px-2 py-1 text-xs">{name}</span>)}
                  </div>
                </div>

                {highlights.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold text-primary">HIGHLIGHTS</div>
                    <ul className="list-disc space-y-1 pl-5 text-xs text-foreground/75">
                      {highlights.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {schedule.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold text-primary">ΠΡΟΓΡΑΜΜΑ ΕΠΕΙΣΟΔΙΟΥ</div>
                    <div className="space-y-1">
                      {schedule.map((item, index) => (
                        <div key={index} className="rounded bg-secondary p-2 text-xs">
                          <div className="font-bold">{index + 1}. {item.title || 'Στάδιο'}</div>
                          <div className="text-foreground/60">{item.start ?? '—'}′–{item.end ?? '—'}′ · {item.desc || ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scenes.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold text-primary">SHOW DIRECTOR · ΣΚΗΝΕΣ</div>
                    <div className="space-y-2">
                      {scenes.map((scene, index) => (
                        <div key={scene.id || index} className="rounded-lg border border-primary/20 bg-secondary p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-sm">{scene.title || scene.act || 'Σκηνή'}</strong>
                            <span className="text-[10px] text-foreground/50">{scene.phase === 'reveal' ? 'ΑΠΟΚΑΛΥΨΗ' : scene.type === 'transition' ? 'ΜΕΤΑΒΑΣΗ' : 'BUILD-UP'}</span>
                          </div>
                          {scene.subtitle && <div className="mt-1 text-xs text-foreground/55">{scene.subtitle}</div>}
                          {scene.content && <div className="mt-2 whitespace-pre-wrap text-xs text-foreground/75">{scene.content}</div>}
                          <div className="mt-2 text-[10px] text-foreground/40">{dateLabel(scene.revealedAt || scene.timestamp)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold text-primary">ΣΤΑΤΙΣΤΙΚΑ</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {stats.map(([name, value]) => (
                        <div key={name} className="rounded bg-secondary p-2 text-xs">
                          <strong>{name}</strong>
                          <pre className="mt-1 whitespace-pre-wrap break-words text-foreground/60">{JSON.stringify(value, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ComicPanel>
        );
      })}
    </div>
  );
}
