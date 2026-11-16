import React, { useEffect, useState } from 'react';
import { request } from '@/api/base44Client';

const input={width:'100%',padding:12,borderRadius:9,border:'1px solid #806a35',background:'#101010',color:'#f5ebd1'};
export default function VIPAccess(){
 const [code,setCode]=useState(''); const [token,setToken]=useState(''); const [vault,setVault]=useState(null);
 const [profile,setProfile]=useState({displayName:'',safeWord:'',intensity:3,preferences:[],boundaries:[],adultConfirmed:false,consentConfirmed:false});
 const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
 async function unlock(e){e.preventDefault();setBusy(true);setMessage('');try{const r=await request('POST','/api/entities/vip-access/unlock',{code});setToken(r.token);setCode('');}catch(err){setMessage(err.message||'Δεν επιτράπηκε η πρόσβαση.')}finally{setBusy(false)}}
 async function loadVault(t=token){try{const data=await fetchVault(t);setVault(data);if(data.profile)setProfile(p=>({...p,...data.profile,adultConfirmed:true,consentConfirmed:true}));}catch(e){setMessage(e.message||'Δεν φορτώθηκε το Vault.')}}
 async function saveProfile(e){e.preventDefault();setBusy(true);setMessage('');try{await requestWithVip(token,'/api/entities/vip-access/profile',profile);setMessage('Το προφίλ αποθηκεύτηκε.');await loadVault()}catch(err){setMessage(err.message||'Δεν αποθηκεύτηκε.')}finally{setBusy(false)}}
 function toggle(list,key){setProfile(p=>({...p,[list]:p[list].includes(key)?p[list].filter(x=>x!==key):[...p[list],key]}))}
 useEffect(()=>{if(token)loadVault(token)},[token]);
 return <main style={{minHeight:'100dvh',background:'#070707',color:'#f4e8c5',padding:'28px 14px',fontFamily:'Arial,sans-serif'}}><div style={{maxWidth:760,margin:'0 auto'}}>
 <header style={{textAlign:'center',padding:25,border:'1px solid #b99a45',borderRadius:16,background:'linear-gradient(145deg,#261e0b,#080808)'}}><div style={{letterSpacing:5,color:'#c9a94e',fontSize:12}}>DEAL OF TEMPTATION</div><h1 style={{fontFamily:'Georgia,serif',fontSize:30,margin:'12px 0'}}>VIP ACCESS / DIGITAL VAULT</h1><p style={{color:'#b6aa8b',fontSize:13}}>Ιδιωτική πρόσβαση · Προσωπικά όρια · Unrated περιεχόμενο</p></header>
 {!token?<form onSubmit={unlock} style={{marginTop:18,padding:20,background:'#111',border:'1px solid #705c2e',borderRadius:14,display:'grid',gap:12}}><label style={{color:'#d8bd72'}}>VIP Secret Pass<input type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} style={{...input,marginTop:7}} /></label><button disabled={busy} style={{padding:13,borderRadius:9,background:'#b99a45',fontWeight:800,color:'#080808'}}>UNLOCK VIP VAULT</button></form>:
 <>
 <form onSubmit={saveProfile} style={{marginTop:18,padding:20,background:'#111',border:'1px solid #705c2e',borderRadius:14,display:'grid',gap:13}}>
 <h2 style={{fontSize:21,color:'#d8bd72'}}>VIP VIBE & SAFETY PROFILE</h2>
 <label style={{color:'#d8bd72'}}>Όνομα παιχνιδιού<input value={profile.displayName} onChange={e=>setProfile(p=>({...p,displayName:e.target.value}))} style={{...input,marginTop:6}} /></label>
 <label style={{color:'#d8bd72'}}>Προσωπική λέξη STOP / Safe Word<input value={profile.safeWord} onChange={e=>setProfile(p=>({...p,safeWord:e.target.value}))} style={{...input,marginTop:6}} /></label>
 <label style={{color:'#d8bd72'}}>Ένταση δοκιμασιών: {profile.intensity}/5<input type="range" min="1" max="5" value={profile.intensity} onChange={e=>setProfile(p=>({...p,intensity:Number(e.target.value)}))} style={{width:'100%'}} /></label>
 <div style={{color:'#d8bd72',fontSize:13}}>Προτιμήσεις</div>{[['questions','Ερωτήσεις'],['missions','Αποστολές'],['surprises','Εκπλήξεις'],['roleplay','Role-play'],['puzzles','Γρίφοι']].map(([k,l])=><label key={k} style={{fontSize:13}}><input type="checkbox" checked={profile.preferences.includes(k)} onChange={()=>toggle('preferences',k)} /> {l}</label>)}
 <div style={{color:'#d8bd72',fontSize:13}}>Όρια / Δεν επιθυμώ</div>{[['touch','Σωματική επαφή'],['restraints','Δεσίματα / περιορισμοί'],['blindfolds','Κάλυψη ματιών'],['alcohol','Αλκοόλ'],['personal-disclosure','Προσωπικές αποκαλύψεις']].map(([k,l])=><label key={k} style={{fontSize:13}}><input type="checkbox" checked={profile.boundaries.includes(k)} onChange={()=>toggle('boundaries',k)} /> {l}</label>)}
 <label style={{fontSize:13}}><input type="checkbox" checked={profile.adultConfirmed} onChange={e=>setProfile(p=>({...p,adultConfirmed:e.target.checked}))}/> Επιβεβαιώνω ότι είμαι 18+</label>
 <label style={{fontSize:13}}><input type="checkbox" checked={profile.consentConfirmed} onChange={e=>setProfile(p=>({...p,consentConfirmed:e.target.checked}))}/> Επιβεβαιώνω ότι συμμετέχω συναινετικά και μπορώ να σταματήσω οποιαδήποτε στιγμή.</label>
 <button disabled={busy} style={{padding:13,borderRadius:9,background:'#b99a45',fontWeight:800,color:'#080808'}}>ΑΠΟΘΗΚΕΥΣΗ ΠΡΟΦΙΛ</button></form>
 {vault&&<div style={{display:'grid',gap:14,marginTop:18}}>
 <section style={{padding:18,border:'1px solid #705c2e',borderRadius:13,background:'#111'}}><h2 style={{color:'#d8bd72',fontSize:20}}>ΚΡΥΦΑ UNRATED MODES</h2>{vault.hiddenModes.map(m=><article key={m.id} style={{padding:'12px 0',borderBottom:'1px solid #40351e'}}><strong>{m.name}</strong><p style={{fontSize:13,color:'#b6aa8b',marginTop:5}}>{m.description}</p></article>)}</section>
 <section style={{padding:18,border:'1px solid #705c2e',borderRadius:13,background:'#111'}}><h2 style={{color:'#d8bd72',fontSize:20}}>UNRATED DECK · 12 CARDS</h2><ol style={{paddingLeft:22,lineHeight:2,fontSize:13}}>{vault.unratedDeck.map(x=><li key={x}>{x}</li>)}</ol><p style={{fontSize:11,color:'#a89b7c'}}>Οι φυσικές/σωματικές εκδοχές δεν εκτελούνται αυτόματα. Κάθε συμμετοχή είναι προαιρετική, με σαφή συναίνεση και άμεσο STOP.</p></section>
 <section style={{padding:18,border:'1px solid #705c2e',borderRadius:13,background:'#111'}}><h2 style={{color:'#d8bd72',fontSize:20}}>DIGITAL VAULT · ΙΣΤΟΡΙΚΟ</h2>{vault.archives.length?vault.archives.map(a=><p key={a.id} style={{padding:'8px 0',borderBottom:'1px solid #40351e',fontSize:13}}>{a.eventDate} · {a.mode} · {a.playerCount} παίκτες · {a.winner||'Χωρίς νικητή'}</p>):<p style={{color:'#a89b7c',fontSize:13}}>Δεν υπάρχουν ακόμη αρχειοθετημένα παιχνίδια.</p>}</section>
 <section style={{padding:18,border:'1px solid #705c2e',borderRadius:13,background:'#111'}}><h2 style={{color:'#d8bd72',fontSize:20}}>VIP CERTIFICATES</h2>{vault.certificates.length?vault.certificates.map(c=><p key={c.id}>{c.title||c.name||'VIP Certificate'}</p>):<p style={{color:'#a89b7c',fontSize:13}}>Δεν έχουν εκδοθεί ακόμη πιστοποιητικά.</p>}</section>
 </div>}
 </>
 }
 {message&&<p role="status" style={{marginTop:14,color:'#e6d7a8'}}>{message}</p>}
 </div></main>;
}
async function requestWithVip(token,path,body){const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw new Error(data.error||'Request failed');return data}
async function fetchVault(token){const res=await fetch('/api/entities/vip-access/vault',{headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(!res.ok)throw new Error(data.error||'Request failed');return data}
