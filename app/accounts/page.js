"use client";
import { useEffect, useState } from "react";

export default function Accounts(){
  const [me,setMe]=useState(null);
  const [accounts,setAccounts]=useState([]);
  const [label,setLabel]=useState("Akun Utama");
  const [msg,setMsg]=useState("");

  async function load(){
    const r=await fetch("/api/auth/me"); const j=await r.json(); setMe(j.user);
    if(j.user){
      const a=await fetch("/api/youtube/accounts"); const aj=await a.json(); setAccounts(aj.accounts||[]);
    }
  }
  useEffect(()=>{load()},[]);

  if(!me) return <div className="card" style={{marginTop:16}}>Silakan <a href="/sign-in" style={{textDecoration:"underline"}}>Sign In</a> dulu.</div>;

  return (
    <div style={{marginTop:16}} className="grid">
      <div className="card">
        <h2 style={{marginTop:0}}>Multi Akun YouTube</h2>
        <div className="grid grid2">
          <div>
            <div className="small" style={{marginBottom:6}}>Label akun</div>
            <input className="input" value={label} onChange={e=>setLabel(e.target.value)} />
          </div>
          <div style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap"}}>
            <a className="btn btn2" href={`/api/youtube/oauth/start?label=${encodeURIComponent(label)}`}>Connect YouTube</a>
            <a className="btn" href="/settings">Buka Settings</a>
          </div>
        </div>
        <p className="small">Jika tidak dapat refresh_token, hapus akses aplikasi di Google Account lalu Connect lagi.</p>
        <div className="small">{msg}</div>
      </div>

      <div className="card">
        <div style={{fontWeight:800,marginBottom:10}}>Daftar akun</div>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>ID</th><th>Label</th><th>Channel</th><th>Aksi</th></tr></thead>
            <tbody>
              {accounts.map(a=>(
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.label}</td>
                  <td>{a.channel_title || "-"}<div className="small">{a.channel_id||""}</div></td>
                  <td>
                    <button className="btn" onClick={async()=>{
                      await fetch(`/api/youtube/accounts?id=${a.id}`,{method:"DELETE"});
                      await load();
                    }}>Hapus</button>
                  </td>
                </tr>
              ))}
              {!accounts.length && <tr><td colSpan="4" className="small">Belum ada akun. Klik Connect YouTube.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
