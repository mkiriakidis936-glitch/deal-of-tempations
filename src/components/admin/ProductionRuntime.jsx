import React,{useMemo,useState} from 'react';
import {base44,getToken} from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const field='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
const label='block space-y-1 text-xs font-bold text-foreground/75';
const makeId=()=>globalThis.crypto?.randomUUID?.()||`evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaultPhases=[
 {id:'night-opening',title:'Βραδινή έναρξη',time:'20:00',notes:'Έναρξη και βασικό επεισόδιο.'},
 {id:'night-break',title:'Overnight Break',time:'00:00',notes:'Προγραμματισμένη παύση παραγωγής.'},
 {id:'morning-return',title:'Morning Return',time:'09:00',notes:'Επαναφορά και συνέχεια.'},
 {id:'overnight-finale',title:'Finale',time:'11:00',notes:'Ολοκλήρωση εμπειρίας.'},
];

export default function ProductionRuntime({selected,record,draft,onChange,onSaved,consents=[]}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[uploading,setUploading]=useState(false);
 const phases=Array.isArray(draft.overnightPhases)&&draft.overnightPhases.length?draft.overnightPhases:defaultPhases;
 const stageIndex=Math.max(0,Math.min(Number(draft.currentStageIndex)||0,(draft.rundown||[]).length-1));
 const activeStage=(draft.rundown||[])[stageIndex];
 const latestConsents=useMemo(()=>{
   const sorted=[...consents].sort((a,b)=>new Date(a.submittedAt||a.created_date||0)-new Date(b.submittedAt||b.created_date||0));
   const latest=new Map();
   for(const item of sorted) latest.set(String(item.participantName||'').trim().toLocaleLowerCase('el-GR'),item);
   return [...latest.values()].filter(item=>item.participantName);
 },[consents]);
 const publicMediaAllowed=latestConsents.length>0&&latestConsents.every(item=>item.publicUseConsent===true&&!item.withdrawn);
 const log=Array.isArray(draft.productionLog)?draft.productionLog:[];
 const update=(patch)=>onChange?.(patch);
 const persist=async(patch,success)=>{
   if(!selected?.sessionCode)return;
   setBusy(true);setMessage('');
   const next={...draft,...patch,sessionCode:selected.sessionCode,sessionId:selected.id,mode:selected.mode||'',eventTitle:selected.event?.title||selected.mode||'DEAL OF TEMPTATIONS'};
   try{
     const saved=record?.id?await base44.entities.ShowProduction.update(record.id,next):await base44.entities.ShowProduction.create(next);
     onSaved?.(saved);setMessage(success||'Η παραγωγή αποθηκεύτηκε.');return saved;
   }catch(error){setMessage(error.message||'Η αποθήκευση απέτυχε.');return null;}
   finally{setBusy(false);}
 };
 const withLog=(action,detail,patch={})=>({
   ...patch,
   productionLog:[{id:makeId(),at:new Date().toISOString(),action,detail:detail||'',stage:activeStage?.title||''},...log].slice(0,250),
 });
 const activateCue=async(data)=>{
   const {items=[]}=await base44.entities.ProductionCue.filter({sessionCode:selected.sessionCode},{limit:1});
   const current=items[0];
   const cueData={sessionCode:selected.sessionCode,active:true,activatedAt:new Date().toISOString(),...data};
   return current?.id?base44.entities.ProductionCue.update(current.id,cueData):base44.entities.ProductionCue.create(cueData);
 };
 const setStatus=(status)=>{
   const now=new Date().toISOString();
   const labels={live:'Η παραγωγή ξεκίνησε',paused:'Η παραγωγή μπήκε σε διάλειμμα',completed:'Η παραγωγή ολοκληρώθηκε',ready:'Η παραγωγή είναι έτοιμη'};
   const timestamps=status==='live'?{liveStartedAt:draft.liveStartedAt||now,resumedAt:now}:status==='paused'?{pausedAt:now}:status==='completed'?{completedAt:now}:{};
   persist(withLog(status,labels[status],{status,...timestamps}),labels[status]);
 };
 const goToStage=async(index)=>{
   const stages=draft.rundown||[];
   if(index<0||index>=stages.length)return;
   const stage=stages[index];
   const saved=await persist(withLog('stage',`Μετάβαση: ${stage.title}`,{currentStageIndex:index}),`Ενεργό στάδιο: ${stage.title}`);
   if(saved){
     try{await activateCue({kind:'scene',label:stage.title,notes:stage.notes||'',stageIndex:index});}
     catch(error){setMessage(error.message||'Το στάδιο αποθηκεύτηκε, αλλά δεν προβλήθηκε στην TV.');}
   }
 };
 const advancePhase=async()=>{
   const next=Math.min((Number(draft.overnightPhaseIndex)||0)+1,phases.length-1);
   const phase=phases[next];
   const saved=await persist(withLog('overnight-phase',`Overnight: ${phase.title}`,{overnightPhaseIndex:next}),`Ενεργή φάση: ${phase.title}`);
   if(saved){try{await activateCue({kind:'scene',label:phase.title,notes:phase.notes||''});}catch(error){setMessage(error.message||'Η φάση αποθηκεύτηκε, αλλά δεν προβλήθηκε στην TV.');}}
 };
 const revealWinner=async()=>{
   if(!String(draft.winnerName||'').trim()){setMessage('Συμπλήρωσε πρώτα το όνομα του νικητή.');return;}
   const saved=await persist(withLog('winner-reveal',`Αποκάλυψη νικητή: ${draft.winnerName}`,{winnerRevealAt:new Date().toISOString()}),'Η αποκάλυψη του νικητή στάλθηκε στην TV.');
   if(saved){try{await activateCue({kind:'winner',label:'WINNER’S VAULT',winnerName:draft.winnerName,winnerNotes:draft.winnerNotes||''});}catch(error){setMessage(error.message||'Τα στοιχεία αποθηκεύτηκαν, αλλά η αποκάλυψη δεν προβλήθηκε.');}}
 };
 const stopCue=async()=>{
   try{const {items=[]}=await base44.entities.ProductionCue.filter({sessionCode:selected.sessionCode},{limit:1});if(items[0]?.id)await base44.entities.ProductionCue.update(items[0].id,{active:false});setMessage('Η προβολή στην TV σταμάτησε.');}
   catch(error){setMessage(error.message||'Δεν ήταν δυνατή η διακοπή της προβολής.');}
 };
 const uploadMedia=async(files)=>{
   if(!files?.length)return;
   setUploading(true);setMessage('');
   try{
     const added=[];
     for(const file of Array.from(files)){
       const response=await fetch(`/api/media/upload?name=${encodeURIComponent(file.name)}`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:file});
       const data=await response.json().catch(()=>({}));
       if(!response.ok)throw new Error(data.error||`Αποτυχία μεταφόρτωσης: ${file.name}`);
       added.push(data.url);
     }
     update({recapMedia:[...(draft.recapMedia||[]),...added]});
     const saved=await persist({recapMedia:[...(draft.recapMedia||[]),...added]},'Το υλικό προστέθηκε στο ιδιωτικό recap.');
     if(!saved)update({recapMedia:[...(draft.recapMedia||[]),...added]});
   }catch(error){setMessage(error.message||'Η μεταφόρτωση απέτυχε.');}
   finally{setUploading(false);}
 };
 const removeMedia=async(url)=>{
   const next=(draft.recapMedia||[]).filter(item=>item!==url);
   update({recapMedia:next});
   await persist({recapMedia:next},'Το αρχείο αφαιρέθηκε από το recap.');
 };
 const copyRecap=async()=>{
   const text=[draft.title||'DEAL OF TEMPTATIONS',draft.winnerName? `Νικητής: ${draft.winnerName}`:'',draft.recapNotes||'',draft.socialTeaser||''].filter(Boolean).join('\n\n');
   try{await navigator.clipboard.writeText(text);setMessage('Το κείμενο recap αντιγράφηκε.');}
   catch{setMessage('Δεν ήταν δυνατή η αντιγραφή από αυτή τη συσκευή.');}
 };
 if(!selected?.sessionCode)return null;
 return <div className="space-y-4">
  <ComicPanel className="bg-card space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-heading text-xl text-primary">LIVE SHOW DIRECTOR</h3><p className="text-xs text-foreground/60">Η ροή παραγωγής λειτουργεί παράλληλα με το υπάρχον Game Control.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs">{draft.status||'planning'}</span></div>
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    <ComicButton size="sm" onClick={()=>setStatus('live')} disabled={busy||draft.status==='live'}>ΕΝΑΡΞΗ SHOW</ComicButton>
    <ComicButton size="sm" variant="dark" onClick={()=>setStatus('paused')} disabled={busy||draft.status==='paused'}>PAUSE / BREAK</ComicButton>
    <ComicButton size="sm" onClick={()=>setStatus('ready')} disabled={busy}>RESUME / READY</ComicButton>
    <ComicButton size="sm" variant="dark" onClick={()=>setStatus('completed')} disabled={busy||draft.status==='completed'}>ΟΛΟΚΛΗΡΩΣΗ</ComicButton>
   </div>
   <div className="rounded-xl border border-border p-3 space-y-2">
    <div className="flex justify-between gap-2 text-xs"><b>ΕΝΕΡΓΟ ΣΤΑΔΙΟ</b><span>{(draft.rundown||[]).length?stageIndex+1+' / '+draft.rundown.length:'—'}</span></div>
    <div className="font-heading text-xl">{activeStage?.title||'Δεν έχει οριστεί στάδιο'}</div>
    <p className="text-xs text-foreground/60">{activeStage?.notes||'—'}</p>
    <div className="flex flex-wrap gap-2"><ComicButton size="sm" variant="dark" onClick={()=>goToStage(stageIndex-1)} disabled={busy||stageIndex===0}>ΠΡΟΗΓΟΥΜΕΝΟ</ComicButton><ComicButton size="sm" onClick={()=>goToStage(stageIndex+1)} disabled={busy||stageIndex>=(draft.rundown||[]).length-1}>ΕΠΟΜΕΝΟ ΣΤΑΔΙΟ + TV</ComicButton><ComicButton size="sm" variant="dark" onClick={stopCue}>STOP TV CUE</ComicButton></div>
   </div>
   <div className="grid gap-2 sm:grid-cols-2">
    {(draft.rundown||[]).map((stage,index)=><button key={stage.id||index} onClick={()=>goToStage(index)} className={`rounded-lg border p-3 text-left text-xs ${index===stageIndex?'border-primary bg-primary/10':'border-border bg-background'}`}><b>{String(index+1).padStart(2,'0')} · {stage.title}</b><span className="block mt-1 text-foreground/55">{stage.duration||0} λεπτά</span></button>)}
   </div>
   {message&&<p className="rounded-lg bg-secondary p-2 text-xs" role="status">{message}</p>}
  </ComicPanel>

  {draft.overnight&&<ComicPanel className="bg-card space-y-3">
   <div><h3 className="font-heading text-lg">OVERNIGHT EXPERIENCE</h3><p className="text-xs text-foreground/60">Διακριτές φάσεις, προγραμματισμένες παύσεις και οργανωμένη επιστροφή.</p></div>
   {phases.map((phase,index)=><div key={phase.id||index} className={`rounded-lg border p-3 space-y-1 ${index===(Number(draft.overnightPhaseIndex)||0)?'border-primary bg-primary/10':'border-border'}`}><div className="flex justify-between gap-2"><b className="text-sm">{phase.title}</b><span className="text-xs">{phase.time||'—'}</span></div><p className="text-xs text-foreground/55">{phase.notes||''}</p></div>)}
   <div className="flex flex-wrap gap-2"><ComicButton size="sm" onClick={()=>advancePhase()} disabled={busy||(Number(draft.overnightPhaseIndex)||0)>=phases.length-1}>ΕΠΟΜΕΝΗ ΦΑΣΗ</ComicButton><ComicButton size="sm" variant="dark" onClick={()=>persist(withLog('overnight-reset','Επαναφορά φάσης Overnight',{overnightPhaseIndex:0}),'Η φάση Overnight επανήλθε στην αρχή.')}>ΕΠΑΝΑΦΟΡΑ</ComicButton></div>
   <p className="text-[10px] text-foreground/50">Οι ώρες είναι σημεία προγραμματισμού. Η αλλαγή φάσης γίνεται από τον υπεύθυνο παραγωγής.</p>
  </ComicPanel>}

  <ComicPanel className="bg-card space-y-3">
   <div><h3 className="font-heading text-lg">WINNER’S VAULT · LIVE REVEAL</h3><p className="text-xs text-foreground/60">Η τελική αποκάλυψη προβάλλεται στην οθόνη TV χωρίς να μεταβάλλει το αποτέλεσμα ή τους κανόνες του παιχνιδιού.</p></div>
   <label className={label}>Νικητής<input className={field} value={draft.winnerName||''} onChange={e=>update({winnerName:e.target.value})}/></label>
   <label className={label}>Κείμενο ανακοίνωσης<textarea className={field} rows="2" value={draft.winnerNotes||''} onChange={e=>update({winnerNotes:e.target.value})}/></label>
   <div className="flex flex-wrap gap-2"><ComicButton size="sm" onClick={revealWinner} disabled={busy||!String(draft.winnerName||'').trim()}>ΑΠΟΚΑΛΥΨΗ ΣΤΗΝ TV</ComicButton><ComicButton size="sm" variant="dark" onClick={()=>persist(withLog('winner-saved','Αποθήκευση στοιχείων Winner’s Vault'),'Τα στοιχεία Winner’s Vault αποθηκεύτηκαν.')}>ΑΠΟΘΗΚΕΥΣΗ VAULT</ComicButton></div>
  </ComicPanel>

  <ComicPanel className="bg-card space-y-3">
   <div><h3 className="font-heading text-lg">SOCIAL MEDIA RECAP</h3><p className="text-xs text-foreground/60">Αρχεία, σημειώσεις και κείμενο recap για την επιλεγμένη διοργάνωση.</p></div>
   <label className={label}>Προσθήκη φωτογραφιών / βίντεο / ήχου<input className={field} type="file" multiple accept="image/*,video/*,audio/*" onChange={e=>uploadMedia(e.target.files)}/></label>
   {uploading&&<p className="text-xs">Μεταφόρτωση αρχείων…</p>}
   <div className="space-y-2">{(draft.recapMedia||[]).map((url,index)=><div key={url+index} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"><a className="min-w-0 truncate text-xs underline" href={url} target="_blank" rel="noreferrer">{url.split('/').pop()}</a><button className="text-xs text-red-400" onClick={()=>removeMedia(url)}>ΑΦΑΙΡΕΣΗ</button></div>)}</div>
   <label className={label}>Recap<textarea className={field} rows="3" value={draft.recapNotes||''} onChange={e=>update({recapNotes:e.target.value})}/></label>
   <label className={label}>Social teaser<textarea className={field} rows="2" value={draft.socialTeaser||''} onChange={e=>update({socialTeaser:e.target.value})}/></label>
   <div className="rounded-lg border border-border p-3 space-y-1"><b className="text-xs">ΔΗΜΟΣΙΑ ΧΡΗΣΗ ΥΛΙΚΟΥ</b><p className="text-xs">{publicMediaAllowed?'Υπάρχει ρητή δημόσια συγκατάθεση από όλους τους συμμετέχοντες με καταχωρισμένη δήλωση.':'Η δημόσια χρήση είναι κλειδωμένη: απαιτείται ενεργή, ρητή συγκατάθεση δημόσιας χρήσης από κάθε συμμετέχοντα.'}</p><span className="text-[10px] text-foreground/50">{latestConsents.length} ατομικές δηλώσεις σε ισχύ</span></div>
   <ComicButton size="sm" variant="dark" onClick={copyRecap}>ΑΝΤΙΓΡΑΦΗ ΚΕΙΜΕΝΟΥ RECAP</ComicButton>
  </ComicPanel>

  <ComicPanel className="bg-card space-y-3">
   <div className="flex items-center justify-between gap-2"><h3 className="font-heading text-lg">PRODUCTION EVENT LOG</h3><span className="text-xs text-foreground/50">{log.length} εγγραφές</span></div>
   {log.length?log.slice(0,30).map(item=><div key={item.id} className="flex gap-3 border-b border-border/60 pb-2 text-xs"><span className="shrink-0 text-foreground/45">{new Date(item.at).toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'})}</span><div><b>{item.action}</b><p className="text-foreground/60">{item.detail}</p></div></div>):<p className="text-xs text-foreground/50">Δεν υπάρχουν ακόμη ενέργειες παραγωγής.</p>}
  </ComicPanel>
 </div>;
}
