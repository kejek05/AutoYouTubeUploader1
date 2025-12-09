"use client";
import { useEffect, useState } from "react";

function fmtBytes(n) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function xhrUpload({ file, kind, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", file);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) resolve(j);
        else reject(new Error(j.error || "Upload gagal"));
      } catch {
        reject(new Error("Response tidak valid"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));

    xhr.open("POST", "/api/files/upload");
    xhr.send(fd);
  });
}

export default function GalleryThumbnails() {
  const [me, setMe] = useState(null);
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState(null);

  async function load() {
    const r = await fetch("/api/files/list?kind=thumbnail");
    const j = await r.json();
    setFiles(j.files || []);
  }

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/auth/me");
      const j = await r.json();
      setMe(j.user || null);
      if (j.user) await load();
    })();
  }, []);

  if (!me) return <div className="card" style={{ marginTop: 16 }}>Silakan <a href="/sign-in" style={{ textDecoration: "underline" }}>Sign In</a> dulu.</div>;

  async function doUpload() {
    if (!selected) return setMsg("Pilih file video dulu.");
    setMsg("Uploading...");
    setProgress(0);
    try {
      const j = await xhrUpload({ file: selected, kind: "thumbnail", onProgress: setProgress });
      setMsg(`OK: ${j.path}`);
      setSelected(null);
      await load();
    } catch (e) {
      setMsg(String(e?.message || e));
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <h2 style={{ marginTop: 0 }}>Gallery • Thumbnails</h2>
          <div className="small">Upload video ke server, lalu copy path untuk dipakai di Uploads.</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap"}}>
          <a className="btn" href="/gallery/videos">Ke Videos</a>
          <a className="btn" href="/uploads">Ke Uploads</a>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <input className="input" type="file" accept="image/*" onChange={(e)=>setSelected(e.target.files?.[0] || null)} />
        <button className="btn btn2" type="button" onClick={doUpload}>Upload Thumbnail</button>
        {progress > 0 && progress < 100 ? (
          <div className="small">Progress: <b>{progress}%</b></div>
        ) : null}
        <div className="small">{msg}</div>

        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Nama</th><th>Ukuran</th><th>Path</th><th>Aksi</th></tr></thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.path}>
                  <td>{f.name}</td>
                  <td className="small">{fmtBytes(f.size)}</td>
                  <td className="small"><code>{f.path}</code></td>
                  <td>
                    <button className="btn" onClick={() => { navigator.clipboard.writeText(f.path); setMsg("Path copied."); }}>Copy</button>
                    <button className="btn" onClick={async () => {
                      await fetch("/api/files/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: f.path }) });
                      await load();
                    }}>Hapus</button>
                  </td>
                </tr>
              ))}
              {!files.length && <tr><td colSpan="4" className="small">Belum ada thumbnail.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
