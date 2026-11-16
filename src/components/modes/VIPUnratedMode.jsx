import React,{useState} from 'react';
import {Panel,Btn} from '@/components/modes/ModeShell';

const MODES=[
 {id:'midnight-interrogation',name:'Midnight Interrogation Room',intro:'Γύροι ερωτήσεων, μυστικών και επιλογών PASS.'},
 {id:'vip-vault-sabotage',name:'VIP Vault Sabotage / Inside Mole',intro:'Κρυφός ρόλος, αποστολές σαμποτάζ και ψηφοφορίες.'},
 {id:'barefoot-maze',name:'Barefoot Maze',intro:'Ψηφιακός γρίφος διαδρομής — χωρίς φυσική μετακίνηση ή κάλυψη ματιών.'},
];
const DECK=[
 ['Wheel of Temptation','Ο τροχός επιλέγει: ερώτηση, γρίφος ή αποστολή ρόλου.'],
 ['Blind Touch','Ψηφιακή επιλογή υφής από εικόνες/περιγραφές. Καμία επαφή χωρίς ξεχωριστή συναίνεση.'],
 ['Police Escort','Role-play: επίλεξε αστείο σενάριο συνοδείας ή PASS.'],
 ['Ice Pass','Επίλεξε ψηφιακά ένα παγωμένο αντικείμενο/εικόνα και απάντησε στην κάρτα. Δεν απαιτείται επαφή με πάγο.'],
 ['Confession or Lockdown','Διάλεξε ακίνδυνη φανταστική εξομολόγηση ή λύσε έναν κωδικό.'],
 ['Role Reversal','Αντάλλαξε ρόλους για έναν γύρο.'],
 ['Whisper Challenge','Διάβασε μυστική φράση και οι άλλοι μαντεύουν.'],
 ['Triple Cuff Chain','Λύσε ακολουθία τριών ψηφιακών γρίφων. Δεν χρησιμοποιούνται δεσμά.'],
 ['Barefoot Tango','Διάλεξε μουσικό ρυθμό και ολοκλήρωσε πρόκληση επιλογής. Δεν απαιτείται χορός.'],
 ['Blackmail Auction','Πλειοδότησε με tokens σε ένα φανταστικό μυστικό.'],
 ['Decibel Scream Test','Προαιρετικό ηχητικό challenge ή εναλλακτικά ψήφος έντασης.'],
 ['Ultimate Lockdown Trigger','Τελικός κωδικός: λύσε το puzzle ή επίλεξε PASS.'],
];
export default function VIPUnratedMode({ctx}){
 const {players,mg,setMg,log}=ctx; const [code,setCode]=useState(''); const [token,setToken]=useState(''); const [error,setError]=useState('');
 const [unlocked,setUnlocked]=useState(false); const [busy,setBusy]=useState(false);
 const game=mg.vipUnrated||{};
 async function unlock(){setBusy(true);setError('');try{const res=await fetch('/api/entities/vip-access/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Ο κωδικός δεν έγινε δεκτός.');setToken(data.token);setUnlocked(true);setCode('');}catch(e){setError(e.message)}finally{setBusy(false)}}
 function start(modeId){setMg({vipUnrated:{active:true,modeId,cardIndex:0,currentCard:DECK[0],targetPlayerId:players[0]?.id||'',responses:[],startedAt:Date.now()}});log('🔐 VIP Unrated mode started: '+MODES.find(m=>m.id===modeId)?.name);}
 function resolve(result){const responses=[...(game.responses||[]),{cardIndex:game.cardIndex,playerId:game.targetPlayerId,result,at:Date.now()}];const next=game.cardIndex+1;if(next>=DECK.length){setMg({vipUnrated:{...game,active:false,completed:true,responses,finishedAt:Date.now()}});log('🏁 VIP Unrated Deck ολοκληρώθηκε.');return;}setMg({vipUnrated:{...game,cardIndex:next,currentCard:DECK[next],responses,targetPlayerId:players[(Math.max(0,players.findIndex(p=>p.id===game.targetPlayerId))+1)%Math.max(1,players.length)]?.id||''}});log('🎴 Unrated card '+(next+1)+'/'+DECK.length+' · '+result);}
 if(!unlocked)return <Panel title="🔐 VIP SECRET PASS" accent="#D8BD72"><p className="text-sm opacity-75">Ξεκλείδωσε τα κρυφά modes και το Unrated Deck με τον προσωπικό VIP κωδικό.</p><div className="flex flex-wrap gap-2"><input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="VIP Secret Pass" className="min-w-0 flex-1 rounded bg-black/40 border border-amber-500/50 px-3 py-2"/><Btn color="bg-amber-600 text-black" disabled={busy||!code.trim()} onClick={unlock}>UNLOCK</Btn></div>{error&&<p className="text-sm text-red-300">{error}</p>}</Panel>;
 if(!game.active&&!game.completed)return <Panel title="🔒 ΚΡΥΦΑ VIP MODES" accent="#D8BD72"><div className="grid gap-2">{MODES.map(m=><div key={m.id} className="rounded border border-amber-500/30 p-3"><b>{m.name}</b><p className="text-xs opacity-70 my-1">{m.intro}</p><Btn color="bg-amber-600 text-black" onClick={()=>start(m.id)}>ΕΝΑΡΞΗ MODE</Btn></div>)}</div><div className="mt-3"><Btn onClick={()=>start('unrated-deck')}>ΕΝΑΡΞΗ UNRATED DECK · 12 ΚΑΡΤΕΣ</Btn></div></Panel>;
 if(game.completed)return <Panel title="🏆 UNRATED SESSION COMPLETE" accent="#D8BD72"><p>Ολοκληρώθηκαν {game.responses?.length||0} κάρτες.</p><div className="space-y-1 text-xs">{(game.responses||[]).map((r,i)=><p key={i}>{i+1}. {players.find(p=>p.id===r.playerId)?.name||'Παίκτης'} · {r.result}</p>)}</div><Btn color="bg-amber-600 text-black" onClick={()=>setMg({vipUnrated:{active:false}})}>ΝΕΑ VIP ΕΠΙΛΟΓΗ</Btn></Panel>;
 const card=game.currentCard||DECK[game.cardIndex||0];const player=players.find(p=>p.id===game.targetPlayerId)||players[0];
 return <Panel title={'🔐 '+(MODES.find(m=>m.id===game.modeId)?.name||'UNRATED DECK')} accent="#D8BD72"><div className="text-xs opacity-65">ΚΑΡΤΑ {(game.cardIndex||0)+1} / 12</div><div className="rounded-lg bg-black/50 border border-amber-500/40 p-4"><div className="text-xl font-heading text-amber-300">{card[0]}</div><p className="mt-2">{card[1]}</p></div><label className="text-sm block">Συμμετέχων<select className="ml-2 bg-black border border-amber-500/40 rounded p-2" value={game.targetPlayerId} onChange={e=>setMg({vipUnrated:{...game,targetPlayerId:e.target.value}})}>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><p className="text-sm">Σειρά: <b>{player?.name||'—'}</b></p><div className="flex flex-wrap gap-2"><Btn color="bg-emerald-700" onClick={()=>resolve('completed')}>ΟΛΟΚΛΗΡΩΘΗΚΕ</Btn><Btn color="bg-secondary" onClick={()=>resolve('pass')}>PASS / ΠΑΡΑΛΕΙΨΗ</Btn><Btn color="bg-red-800" onClick={()=>setMg({vipUnrated:{...game,active:false,stoppedAt:Date.now()}})}>STOP SESSION</Btn></div><p className="text-xs opacity-60">Κάθε κάρτα είναι προαιρετική. Το PASS δεν επιφέρει ποινή. Το STOP σταματά αμέσως τη συνεδρία.</p></Panel>;
}
