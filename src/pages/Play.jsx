import ModeMobile from '@/components/modes/ModeMobile';
import { isNewMode } from '@/data/modes/modeRegistry';
import React, { useRef, useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { getActiveSessionCode, subscribeActiveSession } from '@/lib/activeSession';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import PlayerCard from '@/components/shared/PlayerCard';
import SessionJoin from '@/components/shared/SessionJoin';
import DecibelMeter from '@/components/comic/DecibelMeter';
import MobileMiniGame from '@/components/play/MobileMiniGame';
import QRScanner from '@/components/play/QRScanner';
import SnitchDoubleDown from '@/components/play/SnitchDoubleDown';
import MobileTabBar from '@/components/play/MobileTabBar';
import JuryVote from '@/components/play/JuryVote';
import GrandJuryVote from '@/components/play/GrandJuryVote';
import TimeCapsuleMobile from '@/components/play/TimeCapsuleMobile';
import LastWishMobile from '@/components/play/LastWishMobile';
import MidnightPactMobile from '@/components/play/MidnightPactMobile';
import PrivateMessages from '@/components/play/PrivateMessages';
import SealedVote from '@/components/play/SealedVote';
import { useAudioSync } from '@/hooks/useAudioSync';
import { getPlayerColor } from '@/components/shared/BoardView';
import MobileStatus from '@/components/play/MobileStatus';
import SyncTimerDisplay from '@/components/shared/SyncTimerDisplay';
import WaitingRoom from '@/components/play/WaitingRoom';
import PajamaMobile from '@/components/play/PajamaMobile';

export default function Play() {
  const { session, state, loading, updateState: saveState, joinByCode } = useGameSession({ autoLoad: false });
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const updateState = React.useCallback((patch) => saveState(patch, { playerId: selectedPlayerId }), [saveState, selectedPlayerId]);
  const [scannedCode, setScannedCode] = useState(null);
  const [autoJoinTried, setAutoJoinTried] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  useAudioSync(state);

  const restoredRef = useRef(false);
  const prevTurnRef = useRef(false);
  const currentCodeRef = useRef(null);

  React.useEffect(() => { currentCodeRef.current = session?.sessionCode || null; }, [session?.sessionCode]);

  // Επανασύνδεση: θυμάται την παίκτρια μετά από refresh/κλείσιμο του κινητού.
  React.useEffect(() => {
    if (restoredRef.current || !session?.sessionCode || !state?.players?.length) return;
    restoredRef.current = true;
    const saved = localStorage.getItem(`dot_player_${session.sessionCode}`);
    if (saved && state.players.some((p) => p.id === saved)) {
      setSelectedPlayerId(saved);
      joinByCode(session.sessionCode, saved);
    }
  }, [session?.sessionCode, state?.players]);

  // Δόνηση όταν έρχεται η σειρά της.
  React.useEffect(() => {
    const turnId = state?.players?.[state?.currentPlayerIndex ?? 0]?.id;
    const mine = !!selectedPlayerId && turnId === selectedPlayerId;
    if (mine && !prevTurnRef.current && navigator.vibrate) navigator.vibrate([150, 80, 150]);
    prevTurnRef.current = mine;
  }, [selectedPlayerId, state?.players, state?.currentPlayerIndex]);

  function selectPlayer(id) {
    setSelectedPlayerId(id);
    if (session?.sessionCode) {
      localStorage.setItem(`dot_player_${session.sessionCode}`, id);
      joinByCode(session.sessionCode, id);
    }
  }

  // Επανασύνδεση μετά από refresh/crash: URL κωδικός ή η ενεργή συνεδρία του Admin/Tablet.
  React.useEffect(() => {
    if (autoJoinTried || session) return;
    setAutoJoinTried(true);
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) { joinByCode(code.toUpperCase()); return undefined; }
    let alive = true;
    getActiveSessionCode().then((active) => { if (alive && active) joinByCode(active); });
    return () => { alive = false; };
  }, [autoJoinTried, session, joinByCode]);

  // Αν ο Game Master αλλάξει συνεδρία, ακολουθεί και το κινητό.
  React.useEffect(() => subscribeActiveSession((code) => {
    if (code && code !== currentCodeRef.current) {
      setAutoJoinTried(true);
      joinByCode(code);
    }
  }), [joinByCode]);

  React.useEffect(() => {
    if (activeTab === 'scan' && !state?.grandHeist) {
      setActiveTab('status');
    }
  }, [activeTab, state?.grandHeist]);

  if (loading) {
    return (
      <div className="min-h-screen comic-dots flex items-center justify-center">
        <div className="font-heading text-3xl comic-pulse text-primary">ΦΟΡΤΩΣΗ...</div>
      </div>
    );
  }

  if (!session || !state) {
    return <SessionJoin onJoin={joinByCode} loading={loading} />;
  }

  if (state.stage === 0 && state.mode !== 'pajama') {
    return <WaitingRoom sessionCode={session.sessionCode} />;
  }

  const myPlayer = state.players?.find((p) => p.id === selectedPlayerId);
  const myVote = state.mobileVotes?.[selectedPlayerId];
  const myZapVote = state.electricChairVotes?.[selectedPlayerId];
  const isMyTurn = state.players?.[state.currentPlayerIndex]?.id === selectedPlayerId;

  async function handleVote(targetId) {
    const votes = { ...(state.mobileVotes || {}), [selectedPlayerId]: targetId };
    await updateState({ mobileVotes: votes });
  }

  async function handleZapVote(targetId) {
    const votes = { ...(state.electricChairVotes || {}), [selectedPlayerId]: targetId };
    await updateState({ electricChairVotes: votes });
  }

  if (isNewMode(state.mode) && myPlayer) {
    return (
      <ModeMobile
        state={state}
        me={myPlayer}
        updateState={updateState}
        sessionCode={session.sessionCode}
        onChangePlayer={() => {
          setSelectedPlayerId(null);
          if (session?.sessionCode) {
            localStorage.removeItem(`dot_player_${session.sessionCode}`);
            joinByCode(session.sessionCode);
          }
        }}
      />
    );
  }

  if (state.mode === 'pajama' && myPlayer) {
    return (
      <PajamaMobile
        pj={state.pajama || {}}
        players={state.players || []}
        me={myPlayer}
        updateState={updateState}
        onChangePlayer={() => {
          setSelectedPlayerId(null);
          if (session?.sessionCode) {
            localStorage.removeItem(`dot_player_${session.sessionCode}`);
            joinByCode(session.sessionCode);
          }
        }}
      />
    );
  }

  if (!selectedPlayerId) {
    return (
      <div className="min-h-screen comic-dots p-3">
        <div className="max-w-md mx-auto space-y-4">
          <ComicPanel className="bg-primary text-center py-3">
            <div className="font-heading text-2xl text-tarot-dark">📱 DEAL OF TEMPTATION</div>
            <div className="text-xs font-bold text-tarot-dark/80">Κωδικός: {session.sessionCode}</div>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <div className="font-heading text-xl mb-3 text-center text-primary">ΠΟΙΑ ΕΙΣΑΙ;</div>
            <div className="grid grid-cols-2 gap-3">
              {state.players?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPlayer(p.id)}
                  className="comic-panel-sm p-4 flex flex-col items-center gap-2 bg-secondary hover:bg-primary/20 transition-colors"
                >
                  <div
                    className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center font-heading text-2xl text-white"
                    style={{ backgroundColor: getPlayerColor(p.id) }}
                  >
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="font-heading text-lg text-foreground">{p.name}</span>
                </button>
              ))}
            </div>
          </ComicPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen comic-dots p-3 pb-8">
      {state.stopActive && <div className="fixed inset-0 z-[100] bg-destructive/85 flex items-center justify-center text-center pointer-events-auto"><div className="font-heading text-5xl text-white">⏸ ΣΤΟΠ</div></div>}
      <div className="max-w-md mx-auto space-y-3">
        <div className="sticky top-0 z-20 -mx-3 px-3 py-2 comic-dots border-b-2 border-border">
          <ComicPanel className="bg-card">
            <PlayerCard player={myPlayer} showRole compact />
          </ComicPanel>
          {isMyTurn && (
            <div className="bg-destructive text-foreground text-center font-heading text-lg comic-pulse mt-1 rounded-lg border-2 border-border">
              🔴 ΣΕΙΡΑ ΣΟΥ!
            </div>
          )}
        </div>

        <MobileTabBar active={activeTab} onChange={setActiveTab} hasScan={!!state.grandHeist} />

        {activeTab === 'status' && (
          <>
            <MobileStatus state={state} myPlayer={myPlayer} isMyTurn={isMyTurn} />
            {state.absoluteInterrogation?.active && <AbsoluteInterrogationMobile state={state} myPlayer={myPlayer} updateState={updateState} />}
            {state.bailoutAuction?.active && <BailoutAuctionMobile state={state} myPlayer={myPlayer} updateState={updateState} />}

            <SyncTimerDisplay state={state} variant="mobile" />

            {state.activeCard && (
              <ComicPanel className={`comic-pop ${isMyTurn ? 'bg-primary/20 ring-4 ring-destructive' : 'bg-secondary'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={isMyTurn ? 'text-5xl' : 'text-3xl'}>{state.activeCard.icon || '🎴'}</span>
                  <div className="flex-1">
                    <div className={`font-heading ${isMyTurn ? 'text-2xl' : 'text-lg'} leading-tight text-foreground`}>{state.activeCard.name}</div>
                    <div className="text-xs font-bold text-foreground/60">
                      {state.cardAction === 'street_truth' ? '💬 ΑΛΗΘΕΙΑ'
                        : state.cardAction === 'street_dare' ? '🔥 ΤΟΛΜΗ'
                        : state.cardAction || 'ΚΑΡΤΑ'}
                    </div>
                  </div>
                </div>
                <div className="comic-panel-sm p-3 bg-background">
                  <p className={`font-medium ${isMyTurn ? 'text-lg' : 'text-base'} text-foreground font-body`}>{state.activeCard.text}</p>
                  {state.activeCard.duration && (
                    <div className="mt-2 text-center font-heading text-3xl text-destructive comic-pulse">
                      ⏱ {state.activeCard.duration}″
                    </div>
                  )}
                </div>
                {state.activeCard.desc && (
                  <div className="text-xs mt-2 text-foreground/60 font-body">{state.activeCard.desc}</div>
                )}
              </ComicPanel>
            )}

            {state.activePlotTwist && (
              <ComicPanel className="bg-tarot-royal text-foreground comic-pop">
                <div className="text-center">
                  <div className="text-4xl mb-1">🎭</div>
                  <div className="font-heading text-xl text-tarot-gold">ΑΝΑΤΡΟΠΗ</div>
                  <div className="font-heading text-lg text-foreground">{state.activePlotTwist.name}</div>
                  <div className="text-xs bg-foreground/10 p-1 rounded mt-1">Trigger: {state.activePlotTwist.trigger}</div>
                  <p className="text-sm mt-1 font-body">{state.activePlotTwist.desc}</p>
                </div>
              </ComicPanel>
            )}

            <DecibelMeter label="LAUGH METER" size="md" />

            <MidnightPactMobile state={state} selectedPlayerId={selectedPlayerId} updateState={updateState} />
            <TimeCapsuleMobile state={state} selectedPlayerId={selectedPlayerId} updateState={updateState} />
            <LastWishMobile state={state} selectedPlayerId={selectedPlayerId} updateState={updateState} />
          </>
        )}

        {activeTab === 'votes' && (
          <>
            <JuryVote state={state} selectedPlayerId={selectedPlayerId} updateState={updateState} />
            <GrandJuryVote state={state} selectedPlayerId={selectedPlayerId} updateState={updateState} />

            <ComicPanel className="bg-tarot-crimson/30">
              <div className="font-heading text-lg mb-1 text-primary">🗳️ ΨΗΦΟΣ ΘΥΣΙΑΣ</div>
              <div className="text-xs mb-3 text-foreground/70 font-body">Ψήφισε ποια παραδίδεται στα Κρατητήρια</div>
              <div className="space-y-2">
                {state.players?.filter((p) => p.id !== selectedPlayerId).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleVote(p.id)}
                    className={`comic-panel-sm p-2 w-full text-left flex items-center justify-between transition-all ${
                      myVote === p.id ? 'bg-destructive ring-2 ring-primary' : 'bg-secondary'
                    }`}
                  >
                    <span className="font-bold text-foreground">{p.name}</span>
                    {myVote === p.id && <span className="font-heading text-primary">✓</span>}
                  </button>
                ))}
              </div>
              {myVote && (
                <div className="text-xs mt-2 text-center font-bold text-foreground">
                  Ψήφισες για: {state.players.find((p) => p.id === myVote)?.name}
                </div>
              )}
            </ComicPanel>

            {Object.keys(state.mobileVotes || {}).length > 0 && (
              <ComicPanel className="bg-card">
                <div className="font-heading text-sm mb-2 text-primary">📊 ΨΗΦΟΙ ΠΑΡΕΑΣ</div>
                <div className="space-y-1">
                  {Object.entries(state.mobileVotes).map(([voterId, targetId]) => {
                    const voter = state.players.find((p) => p.id === voterId);
                    const target = state.players.find((p) => p.id === targetId);
                    return (
                      <div key={voterId} className="text-xs flex items-center gap-1 text-foreground">
                        <span className="font-bold">{voter?.name}</span>
                        <span>→</span>
                        <span>{target?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </ComicPanel>
            )}

            <ComicPanel className="bg-tarot-royal/30">
              <div className="font-heading text-lg mb-1 text-primary">⚡ ELECTRIC CHAIR (EP-08)</div>
              <div className="text-xs mb-3 text-foreground/70 font-body">Ψήφισε ποια παίκτρια πάει στην Ηλεκτρική Καρέκλα</div>
              <div className="space-y-2">
                {state.players?.filter((p) => p.id !== selectedPlayerId).map((p) => {
                  const count = Object.values(state.electricChairVotes || {}).filter((v) => v === p.id).length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleZapVote(p.id)}
                      className={`comic-panel-sm p-2 w-full text-left flex items-center justify-between transition-all ${
                        myZapVote === p.id ? 'bg-tarot-royal ring-2 ring-primary' : 'bg-secondary'
                      }`}
                    >
                      <span className="font-bold text-foreground">⚡ {p.name}</span>
                      <span className="flex items-center gap-1">
                        {count > 0 && <span className="text-xs bg-background text-primary px-1.5 rounded font-bold">{count}</span>}
                        {myZapVote === p.id && <span className="font-heading text-primary">✓</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              {myZapVote && (
                <div className="text-center mt-2 text-sm font-bold comic-pulse text-primary">
                  ⚡ Ψήφισες: {state.players.find((p) => p.id === myZapVote)?.name} — ΚΑΘΕΤΕ!
                </div>
              )}
            </ComicPanel>
          </>
        )}

        {activeTab === 'mini' && (
          <>
            <SnitchDoubleDown state={state} selectedPlayerId={selectedPlayerId} updateState={updateState} />
            <MobileMiniGame state={state} selectedPlayerId={selectedPlayerId} updateState={updateState} />
          </>
        )}

        {activeTab === 'show' && (
          <>
            <PrivateMessages state={state} updateState={updateState} selectedPlayerId={selectedPlayerId} />
            <SealedVote state={state} updateState={updateState} selectedPlayerId={selectedPlayerId} />
          </>
        )}

        {activeTab === 'scan' && state.grandHeist && (
          <>
            <QRScanner
              label="📷 QR SCANNER — Σκάναρε τον κωδικό Vault"
              onScan={(text) => {
                const code = text.replace('VAULT-', '');
                setScannedCode(code);
              }}
            />
            {scannedCode && (
              <ComicPanel className="bg-tarot-forest/30 comic-pop">
                <div className="font-heading text-lg text-primary">🔓 ΚΩΔΙΚΟΣ VAULT</div>
                <div className="font-heading text-3xl tracking-widest text-center my-1 text-tarot-gold">{scannedCode}</div>
                <div className="text-xs text-center text-foreground/70 font-body">Πληκτρολόγησέ τον στο Tablet!</div>
              </ComicPanel>
            )}
          </>
        )}

        <ComicButton variant="white" size="sm" onClick={() => { setSelectedPlayerId(null); if (session?.sessionCode) { localStorage.removeItem(`dot_player_${session.sessionCode}`); joinByCode(session.sessionCode); } }} className="w-full">
          🔄 ΑΛΛΑΓΗ ΠΑΙΚΤΡΙΑΣ
        </ComicButton>
      </div>
    </div>
  );
}
function AbsoluteInterrogationMobile({ state, myPlayer, updateState }) {
  const inter = state.absoluteInterrogation;
  const step = inter.step || 0;
  const myVote = inter.votes?.[step]?.[myPlayer.id];
  const isTarget = inter.targetId === myPlayer.id;
  async function vote(value) {
    if (state.stopActive || isTarget || myVote !== undefined) return;
    const votes = { ...(inter.votes || {}), [step]: { ...(inter.votes?.[step] || {}), [myPlayer.id]: value } };
    await updateState({ absoluteInterrogation: { ...inter, votes } });
  }
  return (
    <ComicPanel className="bg-tarot-royal/30 space-y-2">
      <div className="font-heading text-lg text-primary">⚖️ ABSOLUTE INTERROGATION · {step + 1}/3</div>
      <div className="text-sm">{state.players.find((p) => p.id === inter.targetId)?.name} — απάντησε φωναχτά:</div>
      <div className="rounded bg-background p-3 text-base">{inter.questions?.[step]}</div>
      {isTarget ? <div className="text-xs opacity-70">Η δική σου απάντηση ακούγεται στην παρέα. Οι υπόλοιπες ψηφίζουν από τα κινητά τους.</div> : (
        <>
          <div className="text-xs opacity-70">Η απάντηση ήταν αλήθεια ή ψέμα;</div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => vote(true)} disabled={state.stopActive || myVote !== undefined} className={`rounded-lg p-3 font-heading ${myVote === true ? 'bg-emerald-700' : 'bg-secondary'}`}>ΑΛΗΘΕΙΑ</button>
            <button type="button" onClick={() => vote(false)} disabled={state.stopActive || myVote !== undefined} className={`rounded-lg p-3 font-heading ${myVote === false ? 'bg-red-800' : 'bg-secondary'}`}>ΨΕΜΑ</button>
          </div>
          {myVote !== undefined && <div className="text-xs text-center">Η ψήφος σου καταχωρίστηκε.</div>}
        </>
      )}
    </ComicPanel>
  );
}

function BailoutAuctionMobile({ state, myPlayer, updateState }) {
  const [amount, setAmount] = useState('');
  const auction = state.bailoutAuction;
  const myBid = auction.bids?.[myPlayer.id];
  const isTarget = auction.targetId === myPlayer.id;
  async function submit() {
    const bid = Math.max(0, Number(amount) || 0);
    if (!bid || state.stopActive || isTarget) return;
    const bids = { ...(auction.bids || {}), [myPlayer.id]: bid };
    await updateState({ bailoutAuction: { ...auction, bids } });
  }
  return (
    <ComicPanel className="bg-tarot-forest/20 space-y-2">
      <div className="font-heading text-lg text-primary">🔨 BAILOUT AUCTION</div>
      <div className="text-sm">Αποφυλάκιση: {state.players.find((p) => p.id === auction.targetId)?.name}</div>
      <div className="text-xs opacity-70">Η προσφορά σου είναι μυστική από τις υπόλοιπες παίκτριες.</div>
      {isTarget ? <div className="text-sm">Είσαι η παίκτρια της αποφυλάκισης. Δεν συμμετέχεις στη δημοπρασία.</div> : <>
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Προσφορά" className="w-full rounded bg-background border border-border p-2" />
        <button type="button" onClick={submit} disabled={state.stopActive || !(Number(amount) > 0)} className="w-full rounded-lg bg-emerald-800 p-3 font-heading">ΥΠΟΒΟΛΗ ΠΡΟΣΦΟΡΑΣ</button>
      </>}
      {myBid != null && <div className="text-xs text-center">Η προσφορά σου καταχωρίστηκε.</div>}
    </ComicPanel>
  );
}

