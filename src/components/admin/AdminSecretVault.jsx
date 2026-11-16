import React,{useCallback,useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const LABELS={'join-heist':'Join the Heist','event-request':'Custom Event Request','feedback':'Feedback / Hall of Shame'};
const MODES=[
 {id:'midnight-interrogation',name:'Midnight Interrogation Room',description:'Ψηφιακή ανάκριση με ερωτήσεις, μυστικά και επιλογές PASS.'},
 {id:'vip-vault-sabotage',name:'VIP Vault Sabotage / Inside Mole',description:'Κρυφός ρόλος, ψηφοφορίες και αποστολές σαμποτάζ μέσα στο παιχνίδι.'},
 {id:'barefoot-maze',name:'Barefoot Maze',description:'Ψηφιακός γρίφος διαδρομής και επιλογών — χωρίς φυσική μετακίνηση.'},
];
const DECK=['Wheel of Temptation','Blind Touch','Police Escort','Ice Pass','Confession or Lockdown','Role Reversal','Whisper Challenge','Triple Cuff Chain','Barefoot Tango','Blackmail Auction','Decibel Scream Test','Ultimate Lockdown Trigger'];

export default function AdminSecretVault(){
 const [rows,setRows]=useState([]),[profiles,setProfiles]=useState([]),[sessions,setSessions]=useState([]),[certificates,setCertificates]=useState([]);
 const [loading,setLoading]=useState(true),[message,setMessage]=useState(''),[certTitle,setCertTitle]=useState(''),[certProfile,setCertProfile]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setMessage('');
  try{
   const [forms,p,s,c]=await Promise.all([
    base44.entities.PublicFormSubmission.filter({}, {sort:'-created_date',limit:200}),
    base44.entities.VIPAccessProfile.filter({}, {sort:'-created_date',limit:200}),
    base44.entities.VIPAccessSession.filter({}, {sort:'-created_date',limit:200}),
    base44.entities.VIPVaultCertificate.filter({}, {sort:'-created_date',limit:200}),
   ]);
   setRows(forms.items||[]);setProfiles(p.items||[]);setSessions(s.items||[]);setCertificates(c.items||[]);
  }catch(e){setMessage(e.message||'Δεν φορτώθηκαν τα δεδομένα VIP.')}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 async function removeSubmission(id){if(!window.confirm('Να διαγραφεί οριστικά αυτή η υποβολή;'))return;try{await base44.entities.PublicFormSubmission.delete(id);setRows(v=>v.filter(x=>x.id!==id))}catch(e){setMessage(e.message||'Η διαγραφή απέτυχε.')}}
 async function revokeSession(row){if(!window.confirm('Να ανακληθεί αυτή η VIP συνεδρία;'))return;try{await base44.entities.VIPAccessSession.update(row.id,{...row,active:false,revokedAt:new Date().toISOString()});setSessions(v=>v.map(x=>x.id===row.id?{...x,active:false}:x));setMessage('Η VIP συνεδρία ανακλήθηκε.')}catch(e){setMessage(e.message||'Η ανάκληση απέτυχε.')}}
 async function issueCertificate(e){e.preventDefault();if(!certTitle.trim()||!certProfile)return;const profile=profiles.find(p=>p.id===certProfile);try{const created=await base44.entities.VIPVaultCertificate.create({title:certTitle.trim(),profileId:certProfile,displayName:profile?.displayName||'',issuedAt:new Date().toISOString()});setCertificates(v=>[created,...v]);setCertTitle('');setMessage('Το πιστοποιητικό εκδόθηκε.')}catch(err){setMessage(err.message||'Δεν εκδόθηκε το πιστοποιητικό.')}}
 async function deleteCertificate(id){if(!window.confirm('Να διαγραφεί το πιστοποιητικό;'))return;try{await base44.entities.VIPVaultCertificate.delete(id);setCertificates(v=>v.filter(x=>x.id!==id))}catch(e){setMessage(e.message||'Η διαγραφή απέτυχε.')}}
 return <div className="space-y-4">
  <ComicPanel className="bg-card space-y-3"><div className="font-heading text-xl text-primary">VIP VAULT · ΚΕΝΤΡΟ ΔΙΑΧΕΙΡΙΣΗΣ</div><p className="text-sm text-foreground/65">Κεντρική εικόνα δημόσιων αιτήσεων, VIP προφίλ, πρόσβασης και πιστοποιητικών.</p><div className="flex flex-wrap gap-2"><ComicButton onClick={load} disabled={loading}>ΑΝΑΝΕΩΣΗ</ComicButton><span className="text-xs self-center">{rows.length} αιτήσεις · {profiles.length} προφίλ · {sessions.length} συνεδρίες · {certificates.length} πιστοποιητικά</span></div>{message&&<p role="status" className="text-sm">{message}</p>}</ComicPanel>
  {loading?<ComicPanel>Φόρτωση δεδομένων…</ComicPanel>:<>
   <ComicPanel className="bg-card space-y-3"><div className="font-heading text-lg text-primary">VIP PROFILES · ΠΡΟΦΙΛ & ΟΡΙΑ</div>{profiles.length===0?<p className="text-sm text-foreground/60">Δεν υπάρχουν αποθηκευμένα VIP προφίλ.</p>:profiles.map(p=><div key={p.id} className="rounded-lg border border-border p-3 space-y-1"><div className="font-bold">{p.displayName||'Χωρίς όνομα'} <span className="text-xs text-foreground/50">· Ένταση {p.intensity||3}/5</span></div><div className="text-xs">Safe Word: <strong>{p.safeWord||'—'}</strong></div><div className="text-xs">Προτιμήσεις: {(p.preferences||[]).join(', ')||'—'}</div><div className="text-xs">Όρια: {(p.boundaries||[]).join(', ')||'—'}</div><div className="text-xs text-foreground/50">Επιβεβαίωση 18+: {p.adultConfirmed?'Ναι':'Όχι'} · Συναίνεση: {p.consentConfirmed?'Ναι':'Όχι'} · {p.updatedAt?new Date(p.updatedAt).toLocaleString('el-GR'):''}</div></div>)}</ComicPanel>
   <ComicPanel className="bg-card space-y-3"><div className="font-heading text-lg text-primary">VIP ACCESS SESSIONS · ΠΡΟΣΒΑΣΗ</div>{sessions.length===0?<p className="text-sm text-foreground/60">Δεν υπάρχουν VIP συνεδρίες.</p>:sessions.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2"><div className="min-w-0"><div className="font-bold text-sm">{s.active?'Ενεργή':'Ανενεργή / ανακλημένη'}</div><div className="text-xs text-foreground/55">Δημιουργία: {s.createdAt?new Date(s.createdAt).toLocaleString('el-GR'):'—'} · Λήξη: {s.expiresAt?new Date(s.expiresAt).toLocaleString('el-GR'):'—'}</div></div>{s.active&&<ComicButton size="sm" variant="red" onClick={()=>revokeSession(s)}>ΑΝΑΚΛΗΣΗ</ComicButton>}</div>)}</ComicPanel>
   <ComicPanel className="bg-card space-y-3"><div className="font-heading text-lg text-primary">VIP CERTIFICATES · ΠΙΣΤΟΠΟΙΗΤΙΚΑ</div><form onSubmit={issueCertificate} className="grid gap-2"><input className="w-full rounded border border-border bg-background p-2" placeholder="Τίτλος πιστοποιητικού" value={certTitle} onChange={e=>setCertTitle(e.target.value)} required/><select className="w-full rounded border border-border bg-background p-2" value={certProfile} onChange={e=>setCertProfile(e.target.value)} required><option value="">Επίλεξε VIP προφίλ</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.displayName||p.id}</option>)}</select><ComicButton type="submit" disabled={!certTitle.trim()||!certProfile}>ΕΚΔΟΣΗ ΠΙΣΤΟΠΟΙΗΤΙΚΟΥ</ComicButton></form>{certificates.map(c=><div key={c.id} className="flex justify-between items-center gap-2 border-t border-border/60 py-2"><div className="text-sm"><strong>{c.title||'VIP Certificate'}</strong><div className="text-xs text-foreground/50">{c.displayName||''} · {c.issuedAt?new Date(c.issuedAt).toLocaleString('el-GR'):''}</div></div><ComicButton size="sm" variant="red" onClick={()=>deleteCertificate(c.id)}>ΔΙΑΓΡΑΦΗ</ComicButton></div>)}</ComicPanel>
   <ComicPanel className="bg-card space-y-3"><div className="font-heading text-lg text-primary">ΚΡΥΦΑ UNRATED MODES</div>{MODES.map(m=><div key={m.id} className="border-b border-border/60 py-2"><strong>{m.name}</strong><p className="text-xs text-foreground/60">{m.description}</p><span className="text-[11px] text-primary">VIP-only · Δεν εμφανίζεται στις δημόσιες επιλογές</span></div>)}</ComicPanel>
   <ComicPanel className="bg-card space-y-2"><div className="font-heading text-lg text-primary">UNRATED DECK · 12 ΚΑΡΤΕΣ</div><ol className="list-decimal pl-5 text-sm space-y-1">{DECK.map(x=><li key={x}>{x}</li>)}</ol><p className="text-xs text-foreground/60">Κάθε δοκιμασία είναι προαιρετική. Τα όρια και το STOP υπερισχύουν πάντα.</p></ComicPanel>
   <ComicPanel className="bg-card space-y-3"><div className="font-heading text-lg text-primary">ΔΗΜΟΣΙΕΣ ΥΠΟΒΟΛΕΣ</div>{rows.length===0?<p className="text-sm text-foreground/60">Δεν υπάρχουν υποβολές.</p>:rows.map(row=><div key={row.id} className="border-b border-border/60 py-3 space-y-1"><div className="flex justify-between gap-2"><strong className="text-primary">{LABELS[row.type]||row.type}</strong><span className="text-xs text-foreground/50">{new Date(row.submittedAt||row.created_date).toLocaleString('el-GR')}</span></div><div className="text-sm font-bold">{row.name}</div>{row.photoUrl&&<a href={row.photoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Προβολή συνημμένης φωτογραφίας</a>}{[['Επικοινωνία',row.contact],['Email',row.email],['Τύπος event',row.eventType],['Ημερομηνία',row.eventDate],['Συμμετέχοντες',row.guests],['Μήνυμα',row.message],['Πρόταση',row.suggestion]].filter(([,v])=>v).map(([k,v])=><p key={k} className="text-sm"><span className="text-primary">{k}:</span> {v}</p>)}<div className="flex justify-end"><ComicButton size="sm" variant="red" onClick={()=>removeSubmission(row.id)}>ΔΙΑΓΡΑΦΗ ΥΠΟΒΟΛΗΣ</ComicButton></div></div>)}</ComicPanel>
  </>}
 </div>;
}
