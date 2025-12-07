"use client";
import { useEffect, useState } from "react";

export default function Uploads(){
  const [me,setMe]=useState(null);
  const [accounts,setAccounts]=useState([]);
  const [templates,setTemplates]=useState([]);
  const [uploads,setUploads]=useState([]);
  const [schedules,setSchedules]=useState([]);
  const [msg,setMsg]=useState("");

  const [manual,setManual]=useState({youtube_account_id:"",video_path:"",thumbnail_path:"",privacy:"private",title:"",description:"",tags:""});
  const [sched,setSched]=useState({youtube_account_id:"",template_id:"",video_path:"",thumbnail_path:"",privacy:"private",run_at:""});

  async function load(){
    const r=await fetch("/api/auth/me"); const j=await r.json(); setMe(j.user);
    if(!j.user) return;
    const a=await fetch("/api/youtube/accounts"); const aj=await a.json(); setAccounts(aj.accounts||[]);
    const t=await fetch("/api/templates"); const tj=await t.json(); setTemplates(tj.templates||[]);
    const u=await fetch("/api/youtube/uploads"); const uj=await u.json(); setUploads(uj.uploads||[]);
    const s=await fetch("/api/youtube/schedule"); const sj=await s.json(); setSchedules(sj.schedules||[]);
  }
  useEffect(()=>{load()},[]);

  useEffect(()=>{
    if(accounts[0] && !manual.youtube_account_id) setManual(m=>({...m,youtube_account_id:String(accounts[0].id)}));
    if(accounts[0] && !sched.youtube_account_id) setSched(m=>({...m,youtube_account_id:String(accounts[0].id)}));
  },[accounts]);

  if(!me) return <div className="card" style={{marginTop:16}}>Silakan <a href="/sign-in" style={{textDecoration:"underline"}}>Sign In</a> dulu.</div>;

  return (
    <div style={{marginTop:16}} className="grid">
      <div className="card">
        <h2 style={{marginTop:0}}>Manual Upload (pakai path file di server)</h2>
        <div className="grid grid2">
          <div>
            <div className="small" style={{marginBottom:6}}>Akun YouTube</div>
            <select className="input" value={manual.youtube_account_id} onChange={e=>setManual(m=>({...m,youtube_account_id:e.target.value}))}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.label} ({a.channel_title||"?"})</option>)}
            </select>
          </div>
          <div>
            <div className="small" style={{marginBottom:6}}>Privacy</div>
            <select className="input" value={manual.privacy} onChange={e=>setManual(m=>({...m,privacy:e.target.value}))}>
              <option value="private">private</option>
              <option value="unlisted">unlisted</option>
              <option value="public">public</option>
            </select>
          </div>
        </div>

        <div className="grid">
          <input className="input" placeholder="video_path (contoh: /home/ubuntu/videos/a.mp4)" value={manual.video_path} onChange={e=>setManual(m=>({...m,video_path:e.target.value}))}/>
          <input className="input" placeholder="thumbnail_path (opsional, contoh: /home/ubuntu/thumbs/a.jpg)" value={manual.thumbnail_path} onChange={e=>setManual(m=>({...m,thumbnail_path:e.target.value}))}/>
          <input className="input" placeholder="Judul" value={manual.title} onChange={e=>setManual(m=>({...m,title:e.target.value}))}/>
          <textarea className="input" style={{minHeight:120}} placeholder="Deskripsi" value={manual.description} onChange={e=>setManual(m=>({...m,description:e.target.value}))}/>
          <input className="input" placeholder="Tags CSV: tutorial, bisnis, indonesia" value={manual.tags} onChange={e=>setManual(m=>({...m,tags:e.target.value}))}/>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn btn2" onClick={async()=>{
              setMsg("Uploading...");
              const r=await fetch("/api/youtube/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...manual,youtube_account_id:Number(manual.youtube_account_id)})});
              const j=await r.json();
              setMsg(r.ok?`OK videoId=${j.videoId}`:(j.error||"Upload error"));
              await load();
            }}>Upload</button>

            <button className="btn" onClick={async()=>{
              const topic = prompt("Topik video untuk AI SEO?");
              if(!topic) return;
              setMsg("Generating via Gemini...");
              const r=await fetch("/api/gemini/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,language:"id",style:"SEO"})});
              const j=await r.json();
              if(!r.ok) return setMsg(j.error||"Gemini error");
              setManual(m=>({...m,title:j.title||"",description:j.description||"",tags:(j.tags||[]).join(", ")}));
              setMsg("Generated.");
            }}>AI SEO</button>

            <button className="btn" onClick={async()=>{
              await fetch("/api/youtube/stats",{method:"POST"});
              await load();
            }}>Refresh Stats</button>
          </div>
          <div className="small">{msg}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{marginTop:0}}>Schedule Upload Otomatis (WIB)</h2>
        <p className="small">
          Format run_at yang disarankan: <code>YYYY-MM-DD HH:mm</code> WIB. Contoh: <code>2025-12-08 21:30</code>.
        </p>
        <div className="grid grid2">
          <div>
            <div className="small" style={{marginBottom:6}}>Akun YouTube</div>
            <select className="input" value={sched.youtube_account_id} onChange={e=>setSched(m=>({...m,youtube_account_id:e.target.value}))}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.label} ({a.channel_title||"?"})</option>)}
            </select>
          </div>
          <div>
            <div className="small" style={{marginBottom:6}}>Template</div>
            <select className="input" value={sched.template_id} onChange={e=>setSched(m=>({...m,template_id:e.target.value}))}>
              <option value="">(tanpa template)</option>
              {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid">
          <input className="input" placeholder="run_at WIB (YYYY-MM-DD HH:mm)" value={sched.run_at} onChange={e=>setSched(m=>({...m,run_at:e.target.value}))}/>
          <input className="input" placeholder="video_path (contoh: /home/ubuntu/videos/a.mp4)" value={sched.video_path} onChange={e=>setSched(m=>({...m,video_path:e.target.value}))}/>
          <input className="input" placeholder="thumbnail_path (opsional)" value={sched.thumbnail_path} onChange={e=>setSched(m=>({...m,thumbnail_path:e.target.value}))}/>
          <div className="grid grid2">
            <div>
              <div className="small" style={{marginBottom:6}}>Privacy</div>
              <select className="input" value={sched.privacy} onChange={e=>setSched(m=>({...m,privacy:e.target.value}))}>
                <option value="private">private</option>
                <option value="unlisted">unlisted</option>
                <option value="public">public</option>
              </select>
            </div>
            <div style={{display:"flex",alignItems:"end"}}>
              <button className="btn btn2" onClick={async()=>{
                setMsg("Scheduling...");
                const r=await fetch("/api/youtube/schedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
                  ...sched,
                  youtube_account_id:Number(sched.youtube_account_id),
                  template_id: sched.template_id ? Number(sched.template_id) : null
                })});
                const j=await r.json();
                setMsg(r.ok?`Queued schedule id=${j.id}`:(j.error||"Schedule error"));
                await load();
              }}>Queue Schedule</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:800,marginBottom:10}}>Schedule list</div>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>ID</th><th>Akun</th><th>Run At</th><th>Template</th><th>Privacy</th><th>Status</th><th>Error</th><th>Aksi</th></tr></thead>
            <tbody>
              {schedules.map(s=>(
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.account_label}</td>
                  <td>{s.run_at}</td>
                  <td>{s.template_name||"-"}</td>
                  <td>{s.privacy}</td>
                  <td><span className="badge">{s.status}</span></td>
                  <td className="small">{s.last_error||""}</td>
                  <td><button className="btn" onClick={async()=>{await fetch(`/api/youtube/schedule?id=${s.id}`,{method:"DELETE"}); await load();}}>Cancel</button></td>
                </tr>
              ))}
              {!schedules.length && <tr><td colSpan="8" className="small">Belum ada schedule.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:800,marginBottom:10}}>Upload history</div>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>ID</th><th>Akun</th><th>Video</th><th>Status</th><th>Views</th><th>Likes</th><th>Comments</th><th>Log</th></tr></thead>
            <tbody>
              {uploads.map(u=>(
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.account_label}</td>
                  <td>{u.video_id ? <a style={{textDecoration:"underline"}} target="_blank" href={`https://www.youtube.com/watch?v=${u.video_id}`}>{u.video_id}</a> : "-"}</td>
                  <td><span className="badge">{u.status}</span></td>
                  <td>{u.views}</td><td>{u.likes}</td><td>{u.comments}</td>
                  <td className="small">{u.log}</td>
                </tr>
              ))}
              {!uploads.length && <tr><td colSpan="8" className="small">Belum ada upload.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
