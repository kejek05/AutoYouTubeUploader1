"use client";
import { useState } from "react";

export default function SignIn() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [msg,setMsg]=useState("");

  async function submit(e){
    e.preventDefault();
    setMsg("...");
    const r=await fetch("/api/auth/sign-in",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const j=await r.json();
    if(!r.ok) return setMsg(j.error||"Error");
    window.location.href="/dashboard";
  }

  return (
    <div className="card" style={{marginTop:16,maxWidth:520}}>
      <h2 style={{marginTop:0}}>Sign In</h2>
      <form onSubmit={submit} className="grid">
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn2">Masuk</button>
        <button type="button" className="btn" onClick={async()=>{await fetch("/api/auth/sign-out",{method:"POST"}); setMsg("Signed out");}}>Sign Out</button>
        <div className="small">{msg}</div>
        <div className="small">Belum punya akun? <a href="/sign-up" style={{textDecoration:"underline"}}>Sign Up</a></div>
      </form>
    </div>
  );
}
