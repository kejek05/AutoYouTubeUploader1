"use client";
import { useEffect, useState } from "react";

const keys = ["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","OAUTH_REDIRECT_URI","GEMINI_API_KEY"];

export default function Settings(){
  const [me,setMe]=useState(null);
  const [vals,setVals]=useState({});
  const [msg,setMsg]=useState("");

  useEffect(()=>{(async()=>{
    const r=await fetch("/api/auth/me"); const j=await r.json(); setMe(j.user);
    if(j.user){
      const s=await fetch("/api/settings"); const sj=await s.json(); setVals(sj.settings||{});
    }
  })()},[]);

  async function save(){
    setMsg("Saving...");
    const payload = {};
    for(const k of keys) payload[k]=vals[k]||"";
    const r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const j=await r.json();
    setMsg(r.ok ? "Saved" : (j.error||"Error"));
  }

  if(!me) return <div className="card" style={{marginTop:16}}>Silakan <a href="/sign-in" style={{textDecoration:"underline"}}>Sign In</a> dulu.</div>;

  return (
    <div className="card" style={{marginTop:16}}>
      <h2 style={{marginTop:0}}>Settings (Isi semua API)</h2>
      <p className="small">
        Redirect URI contoh: <code>https://namadomain.duckdns.org/api/youtube/oauth/callback</code>
      </p>
      <div className="grid">
        {keys.map(k=>(
          <div key={k}>
            <div className="small" style={{marginBottom:6}}>{k}</div>
            <input className="input" value={vals[k]||""} onChange={e=>setVals(v=>({...v,[k]:e.target.value}))} placeholder={k}/>
          </div>
        ))}
        <button className="btn btn2" onClick={save}>Simpan</button>
        <div className="small">{msg}</div>
      </div>
    </div>
  )
}
