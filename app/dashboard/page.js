"use client";
import { useEffect, useState } from "react";

export default function Dashboard(){
  const [me,setMe]=useState(null);
  const [uploads,setUploads]=useState([]);

  useEffect(()=>{(async()=>{
    const r=await fetch("/api/auth/me"); const j=await r.json(); setMe(j.user);
    if(j.user){
      const u=await fetch("/api/youtube/uploads"); const uj=await u.json(); setUploads(uj.uploads||[]);
    }
  })()},[]);

  const total = uploads.length;
  const ok = uploads.filter(u=>u.status==="success").length;
  const fail = uploads.filter(u=>u.status==="failed").length;

  return (
    <div style={{marginTop:16}} className="grid">
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:18,fontWeight:800}}>Dashboard</div>
            <div className="small">User: {me?.email || "Belum login"}</div>
          </div>
          <button className="btn" onClick={async()=>{
            await fetch("/api/youtube/stats",{method:"POST"});
            const u=await fetch("/api/youtube/uploads"); const uj=await u.json(); setUploads(uj.uploads||[]);
          }}>Refresh Stats</button>
        </div>
      </div>

      <div className="grid grid2">
        <div className="card"><div style={{fontWeight:800}}>Total Uploads</div><div style={{fontSize:34}}>{total}</div></div>
        <div className="card"><div style={{fontWeight:800}}>Success / Failed</div><div style={{fontSize:34}}>{ok} / {fail}</div></div>
      </div>

      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:800}}>Terakhir upload</div>
          <a className="btn" href="/uploads">Buka Uploads</a>
        </div>
        <div style={{overflowX:"auto",marginTop:10}}>
          <table>
            <thead><tr><th>ID</th><th>Akun</th><th>Video</th><th>Status</th><th>Views</th><th>Likes</th><th>Comments</th><th>Log</th></tr></thead>
            <tbody>
              {uploads.slice(0,10).map(u=>(
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.account_label}<div className="small">{u.channel_title||""}</div></td>
                  <td>{u.video_id ? <a style={{textDecoration:"underline"}} target="_blank" href={`https://www.youtube.com/watch?v=${u.video_id}`}>{u.video_id}</a> : "-"}</td>
                  <td><span className="badge">{u.status}</span></td>
                  <td>{u.views}</td><td>{u.likes}</td><td>{u.comments}</td>
                  <td className="small">{u.log}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
