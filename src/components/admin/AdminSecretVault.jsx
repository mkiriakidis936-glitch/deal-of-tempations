import React,{useCallback,useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
const LABELS={'join-heist':'Join the Heist','event-request':'Custom Event Request','feedback':'Feedback / Hall of Shame'};
export default function AdminSecretVault(){
 const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState('');
 const load=useCallback(async()=>{setLoading(true);try{const r=await base44.entities.PublicFormSubmission.filter({}, {sort:'-created_date',limit:200});setRows(r.items||[])}catch(e){setMessage(e.message||'Δεν φορτώθηκαν οι υποβολές.')}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);
 async function remove(id){if(!window.confirm('Να διαγραφεί οριστικά αυτή η υποβολή;'))return;try{await base44.entities.PublicFormSubmission.delete(id);setRows(v=>v.filter(x=>x.id!==id))}catch(e){setMessage(e.message||'Η διαγραφή απέτυχε.')}}
 return <div className="space-y-4"><ComicPanel className="bg-card space-y-3"><div className="font-heading text-xl text-primary">VIP VAULT & ΔΗΜΟΣΙΕΣ ΥΠΟΒΟΛΕΣ</div><p className="text-sm text-foreground/65">Οι δημόσιες αιτήσεις, τα event requests και τα σχόλια εμφανίζονται εδώ. Τα προσωπικά προφίλ VIP και τα αρχεία παραμένουν ιδιωτικά.</p><div className="flex gap-2"><ComicButton onClick={load} disabled={loading}>ΑΝΑΝΕΩΣΗ</ComicButton><span className="text-xs self-center text-foreground/60">{rows.length} υποβολές</span></div>{message&&<p className="text-sm">{message}</p>}</ComicPanel>
 {loading?<ComicPanel>Φόρτωση...</ComicPanel>:rows.length===0?<ComicPanel>Δεν υπάρχουν νέες υποβολές.</ComicPanel>:rows.map(row=><ComicPanel key={row.id} className="bg-card space-y-2"><div className="flex items-center justify-between gap-2"><strong className="text-primary">{LABELS[row.type]||row.type}</strong><span className="text-xs text-foreground/50">{new Date(row.submittedAt||row.created_date).toLocaleString('el-GR')}</span></div><div className="text-sm font-bold">{row.name}</div>{[['Επικοινωνία',row.contact],['Email',row.email],['Τύπος event',row.eventType],['Ημερομηνία',row.eventDate],['Συμμετέχοντες',row.guests],['Μήνυμα',row.message],['Πρόταση',row.suggestion]].filter(([,v])=>v).map(([k,v])=><p key={k} className="text-sm"><span className="text-primary">{k}:</span> {v}</p>)}<div className="flex justify-end"><ComicButton size="sm" variant="red" onClick={()=>remove(row.id)}>ΔΙΑΓΡΑΦΗ</ComicButton></div></ComicPanel>)}
 </div>;
}