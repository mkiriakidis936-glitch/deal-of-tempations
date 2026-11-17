import React, { useState } from 'react';
import { request } from '@/api/base44Client';

const TYPES = [
  { id: 'join-heist', title: 'ΣΥΜΜΕΤΟΧΗ ΣΤΟ HEIST', intro: 'Αίτηση συμμετοχής σε επεισόδιο DEAL OF TEMPTATIONS.' },
  { id: 'event-request', title: 'ΑΙΤΗΜΑ ΙΔΙΩΤΙΚΗΣ ΕΚΔΗΛΩΣΗΣ', intro: 'Ζήτησε μια προσαρμοσμένη εμπειρία ή ιδιωτικό event.' },
  { id: 'feedback', title: 'ΣΧΟΛΙΑ / ΠΡΟΤΑΣΕΙΣ', intro: 'Στείλε σχόλια, ιδέες ή προτάσεις για νέες 18+ κάρτες.' },
];
export default function PublicForms() {
  const [type, setType] = useState('join-heist');
  const [form, setForm] = useState({ name: '', contact: '', email: '', eventType: '', eventDate: '', guests: '', message: '', suggestion: '' });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [photo, setPhoto] = useState(null);
  const active = TYPES.find((x) => x.id === type);
  const change = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }));
  async function submit(e) {
    e.preventDefault(); setBusy(true); setStatus('');
    try {
      let photoUrl = '';
      if (photo && type === 'feedback') {
        const uploaded = await fetch(`/api/media/public-image?name=${encodeURIComponent(photo.name)}`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: photo });
        const uploadData = await uploaded.json();
        if (!uploaded.ok) throw new Error(uploadData.error || 'Η φωτογραφία δεν ανέβηκε.');
        photoUrl = uploadData.url;
      }
      await request('POST', `/api/entities/public-forms/${type}`, { ...form, photoUrl, sessionCode: new URLSearchParams(window.location.search).get('event') || new URLSearchParams(window.location.search).get('sessionCode') || '' });
      setStatus('Η φόρμα υποβλήθηκε με επιτυχία.'); setPhoto(null); setForm({ name: '', contact: '', email: '', eventType: '', eventDate: '', guests: '', message: '', suggestion: '' });
    } catch (err) { setStatus(err.message || 'Η υποβολή δεν ολοκληρώθηκε.'); }
    finally { setBusy(false); }
  }
  const field = (label, key, required = false, placeholder = '') => <label style={{display:'grid',gap:6,fontSize:13,color:'#d8bd72'}}>{label}{required?' *':''}<input required={required} value={form[key]} onChange={change(key)} placeholder={placeholder} style={{width:'100%',padding:12,borderRadius:9,border:'1px solid #806a35',background:'#101010',color:'#f5ebd1'}} /></label>;
  return <main style={{minHeight:'100dvh',background:'#080808',color:'#f5ebd1',padding:'28px 14px',fontFamily:'Arial,sans-serif'}}>
    <div style={{maxWidth:650,margin:'0 auto'}}>
      <header style={{textAlign:'center',padding:24,border:'1px solid #b99a45',borderRadius:16,background:'linear-gradient(140deg,#201a0d,#090909)'}}>
        <div style={{letterSpacing:5,color:'#c9a94e',fontSize:12}}>DEAL OF TEMPTATIONS</div><h1 style={{fontFamily:'Georgia,serif',fontSize:28,margin:'12px 0'}}>ΔΗΜΟΣΙΕΣ ΦΟΡΜΕΣ</h1>
        <p style={{color:'#b6aa8b',fontSize:13}}>Επίλεξε τη φόρμα που θέλεις να συμπληρώσεις.</p>
      </header>
      <nav style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:7,margin:'18px 0'}}>
        {TYPES.map((item)=><button key={item.id} onClick={()=>{setType(item.id);setStatus('')}} style={{padding:'12px 7px',borderRadius:9,border:type===item.id?'2px solid #d8bd72':'1px solid #554725',background:type===item.id?'#33280f':'#111',color:'#f5ebd1',fontSize:11,fontWeight:700}}>{item.title}</button>)}
      </nav>
      <form onSubmit={submit} style={{display:'grid',gap:14,padding:20,border:'1px solid #705c2e',borderRadius:14,background:'#111'}}>
        <div><h2 style={{fontFamily:'Georgia,serif',fontSize:22,color:'#d8bd72'}}>{active.title}</h2><p style={{fontSize:13,color:'#b6aa8b'}}>{active.intro}</p></div>
        {field('Ονοματεπώνυμο','name',true)}
        {type==='join-heist' && field('Τηλέφωνο ή τρόπος επικοινωνίας','contact',true)}
        {type!=='join-heist' && field('Στοιχείο επικοινωνίας','contact')}
        {field('Ηλεκτρονική διεύθυνση','email')}
        {type==='event-request' && <>{field('Τύπος εκδήλωσης','eventType',true)}{field('Ημερομηνία','eventDate')}{field('Αριθμός συμμετεχόντων','guests')}</>}
        {type==='feedback' ? <>{field('Σχόλια / Παρατηρήσεις','message')}{field('Πρόταση για νέες κάρτες 18+','suggestion')}<label style={{display:'grid',gap:6,fontSize:13,color:'#d8bd72'}}>Προαιρετική φωτογραφία (JPG, PNG, WEBP · έως 8MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)} style={{color:'#f5ebd1'}} /></label>{photo&&<p style={{fontSize:12,color:'#b6aa8b'}}>{photo.name}</p>}</> :
          <label style={{display:'grid',gap:6,fontSize:13,color:'#d8bd72'}}>Πρόσθετες πληροφορίες<textarea value={form.message} onChange={change('message')} rows={4} maxLength={3000} style={{padding:12,borderRadius:9,border:'1px solid #806a35',background:'#101010',color:'#f5ebd1'}} /></label>}
        <button disabled={busy} style={{padding:14,borderRadius:9,background:'#b99a45',color:'#090909',fontWeight:800}}>{busy?'ΑΠΟΣΤΟΛΗ...':'ΥΠΟΒΟΛΗ ΦΟΡΜΑΣ'}</button>
        {status && <p role="status" style={{fontSize:13,color:'#e6d7a8'}}>{status}</p>}
        <p style={{fontSize:11,color:'#81775f'}}>Οι υποβολές αποθηκεύονται ιδιωτικά και είναι ορατές μόνο στη διαχείριση.</p>
      </form>
    </div>
  </main>;
}