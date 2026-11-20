import React,{useEffect,useMemo,useState} from 'react';
import {base44,getToken} from '@/api/base44Client';
import {publishProductionCue,stopProductionCue} from '@/lib/productionCue';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const field='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
const label='block space-y-1 text-xs font-bold text-foreground/75';
const makeId=()=>globalThis.crypto?.randomUUID?.()||`evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaultPhases=[
 {id:'night-opening',title:'Βραδινή έναρξη',time:'',notes:'Έναρξη και βασικό επεισόδιο.'},
 {id:'night-break',title:'Overnight Break',time:'',notes:'Προγραμματισμένη παύση παραγωγής.'},
 {id:'morning-return',title:'Morning Return',time:'',notes:'Επαναφορά και συνέχεια.'},
 {id:'overnight-finale',title:'Finale',time:'',notes:'Ολοκλήρωση εμπειρίας.'},
];

export default function ProductionRuntime({selected,record,draft,onChange,onSaved,consents=[],participants=[]}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[uploading,setUploading]=useState(false),[mediaParticipantNames,setMediaParticipantNames]=useState([]);
 useEffect(()=>{setMediaParticipantNames(participants.map(item=>String(item.name||item.displayName||'').trim()).filter(Boolean))},[selected?.sessionCode,participants.length]);
 const phases=Array.isArray(draft.overnightPhases)&&draft.overnightPhases.length?draft.overnightPhases:defaultPhases;
 const stageIndex=Math.max(0,Math.min(Number(draft.currentStageIndex)||0,(draft.rundown||[]).length-1));
 const activeStage=(draft.rundown||[])[stageIndex];
 const latestConsents=useMemo(()=>{
   const sorted=[...consents].sort((a,b)=>new Date(a.created_date||a.submittedAt||0)-new Date(b.created_date||b.submittedAt||0));
   const latest=new Map();
   for(const item of sorted) latest.set(String(item.participantName||'').trim().toLocaleLowerCase('el-GR'),item);
   return [...latest.values()].filter(item=>item.participantName);
 },[consents]);
 const consentMap=new Map(latestConsents.map(item=>[String(item.participantName||'').trim().toLocaleLowerCase('el-GR'),item]));
 const hasUnidentifiedParticipant=participants.some(item=>!String(item.name||item.displayName||'').trim());
 const requiredNames=participants.map(item=>String(item.name||item.displayName||'').trim().toLocaleLowerCase('el-GR')).filter(Boolean);
 const allParticipantsConsented=requiredNames.length>0&&!hasUnidentifiedParticipant&&requiredNames.every(name=>consentMap.has(name)&&!consentMap.get(name).withdrawn);
 const privateMediaAllowed=allParticipantsConsented&&requiredNames.every(name=>consentMap.get(name).recordingConsent===true&&consentMap.get(name).privateUseConsent===true);
 const publicMediaAllowed=allParticipantsConsented&&requiredNames.every(name=>consentMap.get(name).recordingConsent===true&&consentMap.get(name).publicUseConsent===true);
 const canPublishItem=(url)=>{
   const name=String(url).startsWith('private:')?String(url).slice(8):'';
   const item=(draft.recapMediaItems||[]).find(entry=>entry.name===name);
   return !!item&&(item.participants||[]).length>0&&(item.participants||[]).every(participant=>{
     const consent=consentMap.get(String(participant).trim().toLocaleLowerCase('el-GR'));
     return !!consent&&!consent.withdrawn&&consent.adultConfirmed===true&&consent.recordingConsent===true&&consent.publicUseConsent===true;
   });
 };
 const log=Array.isArray(draft.productionLog)?draft.productionLog:[];
 const update=(patch)=>onChange?.(patch);
 const persist=async(patch,success)=>{
   if(!selected?.sessionCode)return;
   setBusy(true);setMessage('');
   const next={...draft,...patch,sessionCode:selected.sessionCode,sessionId:selected.id,mode:selected.mode||'',eventTitle:selected.event?.title||selected.mode||'DEAL OF TEMPTATIONS'};
   try{
     const saved=record?.id?await base44.entities.ShowProduction.update(record.id,{...patch,sessionCode:selected.sessionCode,sessionId:selected.id,mode:selected.mode||'',eventTitle:selected.event?.title||selected.mode||'DEAL OF TEMPTATIONS'}):await base44.entities.ShowProduction.create(next);
     onSaved?.(saved,patch);setMessage(success||'Η παραγωγή αποθηκεύτηκε.');return saved;
   }catch(error){setMessage(error.message||'Η αποθήκευση απέτυχε.');return null;}
   finally{setBusy(false);}
 };
 const withLog=(action,detail,patch={})=>({
   ...patch,
   productionLog:[{id:makeId(),at:new Date().toISOString(),action,detail:detail||'',stage:activeStage?.title||''},...log].slice(0,250),
 });
 const activateCue=async(data)=>publishProductionCue(selected.sessionCode,data);
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
 const editPhase=(id,patch)=>update({overnightPhases:phases.map((phase,index)=>(phase.id||String(index))===id?{...phase,...patch}:phase)});
 const addPhase=()=>update({overnightPhases:[...phases,{id:makeId(),title:'Νέα φάση',time:'',notes:''}]});
 const removePhase=(id)=>{const next=phases.filter((phase,index)=>(phase.id||String(index))!==id);update({overnightPhases:next,overnightPhaseIndex:Math.max(0,Math.min(Number(draft.overnightPhaseIndex)||0,next.length-1))})};
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
   try{await stopProductionCue(selected.sessionCode);setMessage('Η προβολή στην TV σταμάτησε.');}
   catch(error){setMessage(error.message||'Δεν ήταν δυνατή η διακοπή της προβολής.');}
 };
 const uploadMedia=async(files)=>{
   if(!files?.length)return;
   if(!privateMediaAllowed){setMessage('Η μεταφόρτωση είναι κλειδωμένη μέχρι όλοι οι συμμετέχοντες να δώσουν ξεχωριστή συγκατάθεση καταγραφής και ιδιωτικής χρήσης.');return;}
   if(!mediaParticipantNames.length){setMessage('Επίλεξε ποιοι συμμετέχοντες εμφανίζονται στο υλικό.');return;}
   setUploading(true);setMessage('');
   const previousMedia=draft.recapMedia||[],previousItems=draft.recapMediaItems||[];
   const uploadedNames=[];
   try{
     const added=[];const addedItems=[];
     for(const file of Array.from(files)){
       const response=await fetch(`/api/media/private-upload?name=${encodeURIComponent(file.name)}`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:file});
       const data=await response.json().catch(()=>({}));
       if(!response.ok)throw new Error(data.error||`Αποτυχία μεταφόρτωσης: ${file.name}`);
       uploadedNames.push(data.name);added.push(`private:${data.name}`);addedItems.push({name:data.name,participants:[...mediaParticipantNames],uploadedAt:new Date().toISOString(),kind:data.kind});
     }
     const nextMedia=[...previousMedia,...added],nextItems=[...previousItems,...addedItems];
     const saved=await persist({recapMedia:nextMedia,recapMediaItems:nextItems},'Το υλικό προστέθηκε στο ιδιωτικό recap.');
     if(!saved){
       await Promise.all(uploadedNames.map(name=>fetch(`/api/media/private/${encodeURIComponent(name)}`,{method:'DELETE',headers:{Authorization:`Bearer ${getToken()}`}}).catch(()=>{})));
       update({recapMedia:previousMedia,recapMediaItems:previousItems});
     }
   }catch(error){
     await Promise.all(uploadedNames.map(name=>fetch(`/api/media/private/${encodeURIComponent(name)}`,{method:'DELETE',headers:{Authorization:`Bearer ${getToken()}`}}).catch(()=>{})));
     setMessage(error.message||'Η μεταφόρτωση απέτυχε.');
   }
   finally{setUploading(false);}
 };
 const removeMedia=async(url)=>{
   const name=String(url).startsWith('private:')?String(url).slice(8):'';
   const nextMedia=(draft.recapMedia||[]).filter(item=>item!==url);
   const nextItems=(draft.recapMediaItems||[]).filter(item=>item.name!==name);
   const linkedPublished=(draft.recapPublishedMediaItems||[]).filter(item=>item.sourceName===name);
   const nextPublishedItems=(draft.recapPublishedMediaItems||[]).filter(item=>item.sourceName!==name);
   const nextPublished=(draft.recapPublishedMedia||[]).filter(item=>!linkedPublished.some(published=>published.url===item));
   const saved=await persist({recapMedia:nextMedia,recapMediaItems:nextItems,recapPublishedMediaItems:nextPublishedItems,recapPublishedMedia:nextPublished},'Το αρχείο αφαιρέθηκε από το recap.');
   if(!saved)return;
   try{
     if(name)await fetch(`/api/media/private/${encodeURIComponent(name)}`,{method:'DELETE',headers:{Authorization:`Bearer ${getToken()}`}});
     for(const item of linkedPublished)await fetch(`/api/media/${encodeURIComponent(item.name)}`,{method:'DELETE',headers:{Authorization:`Bearer ${getToken()}`}});
   }catch{setMessage('Το αρχείο αφαιρέθηκε από το recap, αλλά κάποιο αντίγραφο δεν διαγράφηκε από την αποθήκευση.');}
 };
 const openMedia=async(url)=>{
   try{
     if(!String(url).startsWith('private:')){window.open(url,'_blank','noopener,noreferrer');return;}
     const name=String(url).slice(8);
     const response=await fetch(`/api/media/private/${encodeURIComponent(name)}`,{headers:{Authorization:`Bearer ${getToken()}`}});
     if(!response.ok)throw new Error('Δεν ήταν δυνατή η ανάκτηση του ιδιωτικού αρχείου.');
     const blob=await response.blob(),objectUrl=URL.createObjectURL(blob),anchor=document.createElement('a');
     anchor.href=objectUrl;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);
   }catch(error){setMessage(error.message||'Το αρχείο δεν άνοιξε.');}
 };
 const publishMedia=async(url)=>{
   if(!canPublishItem(url)){setMessage('Η δημόσια δημοσίευση είναι κλειδωμένη για αυτό το αρχείο μέχρι όλοι όσοι εμφανίζονται σε αυτό να έχουν ενεργή συγκατάθεση καταγραφής και δημόσιας χρήσης.');return;}
   const name=String(url).startsWith('private:')?String(url).slice(8):'';
   const item=(draft.recapMediaItems||[]).find(entry=>entry.name===name);
   if(!item){setMessage('Το αρχείο δεν έχει συσχετισμένους συμμετέχοντες και δεν μπορεί να δημοσιευτεί.');return;}
   try{
     const response=await fetch('/api/media/publish-private',{method:'POST',headers:{Authorization:`Bearer ${getToken()}`,'Content-Type':'application/json'},body:JSON.stringify({name,sessionCode:selected.sessionCode,participants:item.participants||[]})});
     const data=await response.json().catch(()=>({}));
     if(!response.ok)throw new Error(data.error||'Η δημοσίευση απορρίφθηκε.');
     const publishedItem={name:data.name,url:data.url,sourceName:name,participants:[...(item.participants||[])],publishedAt:new Date().toISOString()};
     const items=[...(draft.recapPublishedMediaItems||[]),publishedItem];
     const urls=[...(draft.recapPublishedMedia||[]),data.url];
     const saved=await persist({recapPublishedMediaItems:items,recapPublishedMedia:urls},'Το αρχείο δημοσιεύτηκε. Ο σύνδεσμος είναι διαθέσιμος για χρήση στα social media.');
     if(!saved)await fetch(`/api/media/${encodeURIComponent(data.name)}`,{method:'DELETE',headers:{Authorization:`Bearer ${getToken()}`}});
   }catch(error){setMessage(error.message||'Η δημοσίευση απέτυχε.');}
 };
 const applyWithdrawal=async(consent)=>{
   const participantName=String(consent.participantName||'').trim();
   const key=participantName.toLocaleLowerCase('el-GR');
   const affected=(draft.recapMediaItems||[]).filter(item=>(item.participants||[]).some(name=>String(name).trim().toLocaleLowerCase('el-GR')===key));
   const deleted=[];const deletedPublished=[];
   const published=(draft.recapPublishedMediaItems||[]).filter(item=>(item.participants||[]).some(name=>String(name).trim().toLocaleLowerCase('el-GR')===key));
   for(const item of affected){
     try{
       const response=await fetch(`/api/media/private/${encodeURIComponent(item.name)}`,{method:'DELETE',headers:{Authorization:`Bearer ${getToken()}`}});
       if(response.ok)deleted.push(item.name);
     }catch{}
   }
   for(const item of published){
     try{const response=await fetch(`/api/media/${encodeURIComponent(item.name)}`,{method:'DELETE',headers:{Authorization:`Bearer ${getToken()}`}});if(response.ok)deletedPublished.push(item.name)}catch{}
   }
   const deletedRefs=deleted.map(name=>`private:${name}`);
   const deletedPublishedItems=published.filter(item=>deletedPublished.includes(item.name));
   const nextMedia=(draft.recapMedia||[]).filter(url=>!deletedRefs.includes(url));
   const nextItems=(draft.recapMediaItems||[]).filter(item=>!deleted.includes(item.name));
   const nextPublishedItems=(draft.recapPublishedMediaItems||[]).filter(item=>!deletedPublished.includes(item.name));
   const nextPublished=(draft.recapPublishedMedia||[]).filter(url=>!deletedPublishedItems.some(item=>item.url===url));
   const nextActions=[...(draft.withdrawalActions||[]),{participantName,appliedAt:new Date().toISOString(),deletedFiles:deleted.length,deletedPublicFiles:deletedPublished.length}];
   const saved=await persist(withLog('consent-withdrawal-applied',`Εφαρμογή ανάκλησης για ${participantName}: αφαιρέθηκαν ${deleted.length} ιδιωτικά και ${deletedPublished.length} δημόσια αρχεία από την εφαρμογή.`,{recapMedia:nextMedia,recapMediaItems:nextItems,recapPublishedMedia:nextPublished,recapPublishedMediaItems:nextPublishedItems,withdrawalActions:nextActions}),`Η ανάκληση εφαρμόστηκε. Αφαιρέθηκαν ${deleted.length} ιδιωτικά και ${deletedPublished.length} δημόσια αρχεία από την εφαρμογή.`);
   if(!saved&&deleted.length)setMessage('Τα αρχεία διαγράφηκαν, αλλά η ενημέρωση του αρχείου παραγωγής απέτυχε. Ανανέωσε τη σελίδα πριν συνεχίσεις.');
 };
 const copyRecap=async()=>{
   const text=[draft.title||'DEAL OF TEMPTATIONS',draft.winnerName? `Νικητής: ${draft.winnerName}`:'',draft.recapNotes||'',draft.socialTeaser||'',(draft.recapPublishedMedia||[]).join('\n')].filter(Boolean).join('\n\n');
   try{await navigator.clipboard.writeText(text);setMessage('Το κείμενο recap αντιγράφηκε.');}
   catch{setMessage('Δεν ήταν δυνατή η αντιγραφή από αυτή τη συσκευή.');}
 };
 if(!selected?.sessionCode)return null;
 return <div className="space-y-4">
  <ComicPanel className="bg-card space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-heading text-xl text-primary">LIVE SHOW DIRECTOR</h3><p className="text-xs text-foreground/60">Η ροή παραγωγής λειτουργεί παράλληλα με το υπάρχον Game Control.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs">{draft.status||'planning'}</span></div>
   <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
    <ComicButton size="sm" variant="dark" onClick={()=>setStatus('ready')} disabled={busy||draft.status==='ready'}>ΕΤΟΙΜΑΣΙΑ</ComicButton>
    <ComicButton size="sm" onClick={()=>setStatus('live')} disabled={busy||draft.status==='live'||draft.status==='completed'}>ΕΝΑΡΞΗ SHOW</ComicButton>
    <ComicButton size="sm" variant="dark" onClick={()=>setStatus('paused')} disabled={busy||draft.status==='paused'||draft.status==='completed'}>PAUSE / BREAK</ComicButton>
    <ComicButton size="sm" onClick={()=>setStatus('live')} disabled={busy||draft.status!=='paused'}>RESUME SHOW</ComicButton>
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
   {phases.map((phase,index)=><div key={phase.id||index} className={`rounded-lg border p-3 space-y-2 ${index===(Number(draft.overnightPhaseIndex)||0)?'border-primary bg-primary/10':'border-border'}`}><div className="grid grid-cols-[1fr_110px_auto] gap-2"><input className={field} value={phase.title||''} onChange={e=>editPhase(phase.id||String(index),{title:e.target.value})}/><input className={field} type="time" value={phase.time||''} onChange={e=>editPhase(phase.id||String(index),{time:e.target.value})}/><button className="text-xs text-red-400" onClick={()=>removePhase(phase.id||String(index))} disabled={phases.length<=1}>×</button></div><input className={field} value={phase.notes||''} placeholder="Οδηγίες φάσης" onChange={e=>editPhase(phase.id||String(index),{notes:e.target.value})}/></div>)}
   <div className="flex flex-wrap gap-2"><ComicButton size="sm" onClick={()=>advancePhase()} disabled={busy||(Number(draft.overnightPhaseIndex)||0)>=phases.length-1}>ΕΠΟΜΕΝΗ ΦΑΣΗ</ComicButton><ComicButton size="sm" variant="dark" onClick={()=>persist(withLog('overnight-reset','Επαναφορά φάσης Overnight',{overnightPhaseIndex:0}),'Η φάση Overnight επανήλθε στην αρχή.')}>ΕΠΑΝΑΦΟΡΑ</ComicButton><ComicButton size="sm" variant="dark" onClick={addPhase}>+ ΦΑΣΗ</ComicButton></div>
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
   <label className={label}>Προσθήκη φωτογραφιών / βίντεο / ήχου<input className={field} type="file" multiple accept="image/*,video/*,audio/*" disabled={!privateMediaAllowed||uploading} onChange={e=>uploadMedia(e.target.files)}/></label>
   <p className="text-xs text-foreground/60">{privateMediaAllowed?'Η ιδιωτική καταγραφή επιτρέπεται για όλους τους δηλωμένους συμμετέχοντες.':'Η μεταφόρτωση παραμένει κλειδωμένη μέχρι να καταχωριστούν οι απαιτούμενες ατομικές συγκαταθέσεις.'}</p>
   {uploading&&<p className="text-xs">Μεταφόρτωση αρχείων…</p>}
   <div className="rounded-lg border border-border p-3 space-y-2"><b className="text-xs">ΠΟΙΟΙ ΕΜΦΑΝΙΖΟΝΤΑΙ ΣΤΟ ΥΛΙΚΟ</b>{participants.map((person,index)=>{const name=String(person.name||person.displayName||'').trim();return name?<label key={person.id||name+index} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={mediaParticipantNames.includes(name)} onChange={e=>setMediaParticipantNames(current=>e.target.checked?[...current,name]:current.filter(item=>item!==name))}/>{name}</label>:null})}</div>
   <div className="space-y-2">{(draft.recapMedia||[]).map((url,index)=><div key={url+index} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"><button className="min-w-0 truncate text-left text-xs underline" onClick={()=>openMedia(url)}>{String(url).startsWith('private:')?String(url).slice(8):url.split('/').pop()}</button>{String(url).startsWith('private:')&&<ComicButton size="sm" variant="dark" onClick={()=>publishMedia(url)} disabled={!canPublishItem(url)||(draft.recapPublishedMediaItems||[]).some(item=>item.sourceName===String(url).slice(8))}>ΔΗΜΟΣΙΕΥΣΗ</ComicButton>}<button className="text-xs text-red-400" onClick={()=>removeMedia(url)}>ΑΦΑΙΡΕΣΗ</button></div>)}</div>
   {(latestConsents.filter(item=>item.withdrawn)).length>0&&<div className="rounded-lg border border-amber-500/40 p-3 space-y-2"><b className="text-xs">ΑΝΑΚΛΗΣΕΙΣ ΣΥΓΚΑΤΑΘΕΣΗΣ</b>{latestConsents.filter(item=>item.withdrawn).map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{item.participantName} · αίτημα ανάκλησης</span><ComicButton size="sm" variant="dark" onClick={()=>applyWithdrawal(item)}>ΕΦΑΡΜΟΓΗ ΑΝΑΚΛΗΣΗΣ</ComicButton></div>)}<p className="text-[10px] text-foreground/50">Η εφαρμογή αφαιρεί τα ιδιωτικά και δημόσια αρχεία της εφαρμογής που έχουν συσχετιστεί με το συγκεκριμένο άτομο. Αντίγραφα που έχουν ήδη αναρτηθεί σε τρίτες πλατφόρμες χρειάζονται ξεχωριστή αφαίρεση.</p></div>}
   {(draft.recapPublishedMedia||[]).length>0&&<div className="rounded-lg border border-primary/30 p-3 space-y-2"><b className="text-xs">ΔΗΜΟΣΙΕΥΜΕΝΑ ΑΡΧΕΙΑ</b>{(draft.recapPublishedMedia||[]).map(url=><a key={url} className="block break-all text-xs underline" href={url} target="_blank" rel="noreferrer">{url}</a>)}</div>}
   <label className={label}>Recap<textarea className={field} rows="3" value={draft.recapNotes||''} onChange={e=>update({recapNotes:e.target.value})}/></label>
   <label className={label}>Social teaser<textarea className={field} rows="2" value={draft.socialTeaser||''} onChange={e=>update({socialTeaser:e.target.value})}/></label>
   <div className="rounded-lg border border-border p-3 space-y-1"><b className="text-xs">ΔΗΜΟΣΙΑ ΧΡΗΣΗ ΥΛΙΚΟΥ</b><p className="text-xs">{publicMediaAllowed?'Υπάρχει ρητή δημόσια συγκατάθεση καταγραφής και δημοσίευσης από όλους τους συμμετέχοντες.':'Η δημόσια χρήση ελέγχεται ανά αρχείο και επιτρέπεται μόνο όταν όλοι οι επιλεγμένοι συμμετέχοντες έχουν ενεργή συγκατάθεση καταγραφής και δημόσιας χρήσης.'}</p><span className="text-[10px] text-foreground/50">{latestConsents.length} ατομικές δηλώσεις · {requiredNames.length} συμμετέχοντες</span></div>
   <ComicButton size="sm" variant="dark" onClick={copyRecap}>ΑΝΤΙΓΡΑΦΗ ΚΕΙΜΕΝΟΥ RECAP</ComicButton>
  </ComicPanel>

  <ComicPanel className="bg-card space-y-3">
   <div className="flex items-center justify-between gap-2"><h3 className="font-heading text-lg">PRODUCTION EVENT LOG</h3><span className="text-xs text-foreground/50">{log.length} εγγραφές</span></div>
   {log.length?log.slice(0,30).map(item=><div key={item.id} className="flex gap-3 border-b border-border/60 pb-2 text-xs"><span className="shrink-0 text-foreground/45">{new Date(item.at).toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'})}</span><div><b>{item.action}</b><p className="text-foreground/60">{item.detail}</p></div></div>):<p className="text-xs text-foreground/50">Δεν υπάρχουν ακόμη ενέργειες παραγωγής.</p>}
  </ComicPanel>
 </div>;
}
