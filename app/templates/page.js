"use client";
import { useEffect, useState } from "react";

export default function Templates(){
  const [me,setMe]=useState(null);
  const [templates,setTemplates]=useState([]);
  const [form,setForm]=useState({name:"Default",title_tpl:"",description_tpl:"",tags_csv:""});
  const [msg,setMsg]=useState("");

  async function load(){
    const r=await fetch("/api/auth/me"); const j=await r.json(); setMe(j.user);
    if(j.user){
      const t=await fetch("/api/templates"); const tj=await t.json(); setTemplates(tj.templates||[]);
    }
  }
  useEffect(()=>{load()},[]);

  if(!me) return <div className="card" style={{marginTop:16}}>Silakan <a href="/sign-in" style={{textDecoration:"underline"}}>Sign In</a> dulu.</div>;

  return (
    <div style={{marginTop:16}} className="grid">
      <div className="card">
        <h2 style={{marginTop:0}}>Template Metadata</h2>
        <div className="grid">
          <input className="input" placeholder="Nama template" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input className="input" placeholder="Judul" value={form.title_tpl} onChange={e=>setForm(f=>({...f,title_tpl:e.target.value}))}/>
          <textarea className="input" style={{minHeight:120}} placeholder="Deskripsi" value={form.description_tpl} onChange={e=>setForm(f=>({...f,description_tpl:e.target.value}))}/>
          <input className="input" placeholder="tags (csv) contoh: bisnis, tutorial, indonesia" value={form.tags_csv} onChange={e=>setForm(f=>({...f,tags_csv:e.target.value}))}/>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn btn2" onClick={async()=>{
              setMsg("Saving...");
              const r=await fetch("/api/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
              setMsg(r.ok?"Saved":"Error");
              setForm({name:"Default",title_tpl:"",description_tpl:"",tags_csv:""});
              await load();
            }}>Tambah</button>

            <button className="btn" onClick={async()=>{
              const topic = prompt("Topik video untuk AI SEO?");
              if(!topic) return;
              setMsg("Generating via Gemini...");
              const r=await fetch("/api/gemini/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,language:"id",style:"SEO"})});
              const j=await r.json();
              if(!r.ok) return setMsg(j.error||"Gemini error");
              setForm(f=>({...f,title_tpl:j.title||"",description_tpl:j.description||"",tags_csv:(j.tags||[]).join(", ")}));
              setMsg("Generated. Silakan simpan jadi template.");
            }}>AI Generate (Gemini)</button>
          </div>
          <div className="small">{msg}</div>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:800,marginBottom:10}}>Daftar template</div>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>ID</th><th>Nama</th><th>Judul</th><th>Tags</th><th>Aksi</th></tr></thead>
            <tbody>
              {templates.map(t=>(
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td className="small">{t.title_tpl}</td>
                  <td className="small">{t.tags_csv}</td>
                  <td>
                    <button className="btn" onClick={async()=>{await fetch(`/api/templates?id=${t.id}`,{method:"DELETE"}); await load();}}>Hapus</button>
                  </td>
                </tr>
              ))}
              {!templates.length && <tr><td colSpan="5" className="small">Belum ada template.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
