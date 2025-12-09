"use client";

import { useEffect, useMemo, useState } from "react";

function fmtBytes(n) {
  if (!Number.isFinite(n)) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// datetime-local -> "YYYY-MM-DD HH:mm:ss" (anggap input user = WIB)
function toWibSqliteDatetime(datetimeLocalStr) {
  if (!datetimeLocalStr) return "";
  const [date, time] = datetimeLocalStr.split("T");
  if (!date || !time) return "";
  const hhmm = time.length === 5 ? `${time}:00` : time;
  return `${date} ${hhmm}`;
}

export default function Uploads() {
  const [me, setMe] = useState(null);
  const [serverTime, setServerTime] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [galleryVideos, setGalleryVideos] = useState([]);
  const [galleryThumbs, setGalleryThumbs] = useState([]);

  const [uploads, setUploads] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [tab, setTab] = useState("manual"); // manual | schedule
  const [msg, setMsg] = useState("");

  // Manual
  const [mAccountId, setMAccountId] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mTags, setMTags] = useState("");
  const [mPrivacy, setMPrivacy] = useState("private");
  const [mVideoPath, setMVideoPath] = useState("");
  const [mThumbPath, setMThumbPath] = useState("");

  // Schedule
  const [sAccountId, setSAccountId] = useState("");
  const [sTemplateId, setSTemplateId] = useState("");
  const [sPrivacy, setSPrivacy] = useState("private");
  const [sVideoPath, setSVideoPath] = useState("");
  const [sThumbPath, setSThumbPath] = useState("");
  const [sRunAtLocal, setSRunAtLocal] = useState(""); // datetime-local

  const defaultAccountId = useMemo(
    () => (accounts?.[0]?.id ? String(accounts[0].id) : ""),
    [accounts]
  );

  async function refreshServerTime() {
    try {
      const r = await fetch("/api/server-time", { cache: "no-store" });
      const j = await r.json();
      setServerTime(j.text || "");
    } catch {
      setServerTime("");
    }
  }

  async function loadAll() {
    const rMe = await fetch("/api/auth/me", { cache: "no-store" });
    const jMe = await rMe.json();
    setMe(jMe.user || null);
    if (!jMe.user) return;

    await refreshServerTime();

    const [rAcc, rTpl, rUp, rSch, rVid, rTh] = await Promise.all([
      fetch("/api/youtube/accounts", { cache: "no-store" }),
      fetch("/api/templates", { cache: "no-store" }),
      fetch("/api/youtube/uploads", { cache: "no-store" }),
      fetch("/api/youtube/schedule", { cache: "no-store" }),
      fetch("/api/files/list?kind=video", { cache: "no-store" }),
      fetch("/api/files/list?kind=thumbnail", { cache: "no-store" }),
    ]);

    const jAcc = await rAcc.json();
    const jTpl = await rTpl.json();
    const jUp = await rUp.json();
    const jSch = await rSch.json();
    const jVid = await rVid.json();
    const jTh = await rTh.json();

    setAccounts(jAcc.accounts || []);
    setTemplates(jTpl.templates || []);
    setUploads(jUp.uploads || []);
    setSchedules(jSch.schedules || []);
    setGalleryVideos(jVid.files || []);
    setGalleryThumbs(jTh.files || []);
  }

  async function refreshUploadsAndSchedules() {
    const [rUp, rSch] = await Promise.all([
      fetch("/api/youtube/uploads", { cache: "no-store" }),
      fetch("/api/youtube/schedule", { cache: "no-store" }),
    ]);
    const jUp = await rUp.json();
    const jSch = await rSch.json();
    setUploads(jUp.uploads || []);
    setSchedules(jSch.schedules || []);
  }

  useEffect(() => {
    loadAll().catch((e) => setMsg(String(e?.message || e)));
  }, []);

  useEffect(() => {
    const id = setInterval(refreshServerTime, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!accounts.length) return;
    if (!mAccountId) setMAccountId(defaultAccountId);
    if (!sAccountId) setSAccountId(defaultAccountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, defaultAccountId]);

  function chooseVideoPath(path, mode) {
    if (!path) return;
    if (mode === "manual") setMVideoPath(path);
    else setSVideoPath(path);
  }
  function chooseThumbPath(path, mode) {
    if (!path) return;
    if (mode === "manual") setMThumbPath(path);
    else setSThumbPath(path);
  }

  async function doManualUpload(e) {
    e.preventDefault();
    setMsg("Uploading...");
    try {
      const payload = {
        youtube_account_id: Number(mAccountId),
        video_path: mVideoPath,
        title: mTitle,
        description: mDescription,
        tags: mTags,
        privacy: mPrivacy,
        thumbnail_path: mThumbPath || null,
      };
      const r = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload gagal");
      setMsg(`OK: ${j.videoId || "uploaded"}`);
      await refreshUploadsAndSchedules();
    } catch (err) {
      setMsg(String(err?.message || err));
      await refreshUploadsAndSchedules().catch(() => {});
    }
  }

  async function doCreateSchedule(e) {
    e.preventDefault();
    setMsg("Membuat jadwal...");
    try {
      const run_at = toWibSqliteDatetime(sRunAtLocal);
      if (!run_at) throw new Error("Tanggal & jam wajib (WIB).");

      const payload = {
        youtube_account_id: Number(sAccountId),
        template_id: sTemplateId ? Number(sTemplateId) : null,
        video_path: sVideoPath,
        thumbnail_path: sThumbPath || null,
        privacy: sPrivacy,
        run_at,
      };

      const r = await fetch("/api/youtube/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Gagal membuat schedule");

      setMsg(`Schedule dibuat (#${j.id})`);
      await refreshUploadsAndSchedules();
    } catch (err) {
      setMsg(String(err?.message || err));
    }
  }

  async function cancelSchedule(id) {
    setMsg("Cancel schedule...");
    const r = await fetch(`/api/youtube/schedule?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    setMsg(r.ok ? "Schedule dicancel" : (j.error || "Gagal cancel"));
    await refreshUploadsAndSchedules();
  }

  async function aiFillManual() {
    const topic = prompt("Topik video untuk AI SEO (Gemini)?");
    if (!topic) return;
    setMsg("Generating SEO via Gemini...");
    const r = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, language: "id", style: "SEO" }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Gemini error");
    setMTitle(j.title || "");
    setMDescription(j.description || "");
    setMTags(Array.isArray(j.tags) ? j.tags.join(", ") : "");
    setMsg("AI metadata terisi. Silakan upload.");
  }

  if (!me) {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        Silakan <a href="/sign-in" style={{ textDecoration: "underline" }}>Sign In</a> dulu.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }} className="grid">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Uploads</div>
            <div className="small">Manual upload & Scheduler (WIB). Pilih file dari Gallery.</div>
            {serverTime ? <div className="small" style={{ marginTop: 6 }}>Server time: <b>{serverTime}</b></div> : null}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className={"btn " + (tab === "manual" ? "btn2" : "")} onClick={() => setTab("manual")}>Manual</button>
            <button className={"btn " + (tab === "schedule" ? "btn2" : "")} onClick={() => setTab("schedule")}>Scheduler</button>
            <button className="btn" onClick={async () => { setMsg("Refreshing..."); await refreshUploadsAndSchedules(); setMsg("OK"); }}>Refresh</button>
          </div>
        </div>
        <div className="small" style={{ marginTop: 10 }}>{msg}</div>
      </div>

      {tab === "manual" ? (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Manual Upload</h2>

          {!accounts.length ? (
            <div className="small">
              Belum ada akun YouTube. Tambahkan di menu <a href="/accounts" style={{ textDecoration: "underline" }}>Accounts</a>.
            </div>
          ) : null}

          <form onSubmit={doManualUpload} className="grid">
            <div className="grid grid2">
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Akun YouTube</div>
                <select className="input" value={mAccountId} onChange={(e) => setMAccountId(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      #{a.id} — {a.label} {a.channel_title ? `(${a.channel_title})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Privacy</div>
                <select className="input" value={mPrivacy} onChange={(e) => setMPrivacy(e.target.value)}>
                  <option value="public">public</option>
                  <option value="unlisted">unlisted</option>
                  <option value="private">private</option>
                </select>
              </div>
            </div>

            <div className="grid grid2">
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Video path (server)</div>
                <input className="input" placeholder="/abs/path/video.mp4" value={mVideoPath} onChange={(e) => setMVideoPath(e.target.value)} required />
                <div className="small" style={{ marginTop: 6 }}>
                  Pilih dari Gallery Videos:
                  <select className="input" style={{ marginTop: 6 }} onChange={(e) => chooseVideoPath(e.target.value, "manual")} value="">
                    <option value="">— pilih video —</option>
                    {galleryVideos.slice(0, 80).map((f) => (
                      <option key={f.path} value={f.path}>{f.name} ({fmtBytes(f.size)})</option>
                    ))}
                  </select>
                  <div className="small" style={{ marginTop: 6 }}>
                    <a href="/gallery/videos" style={{ textDecoration: "underline" }}>Buka Gallery Videos</a>
                  </div>
                </div>
              </div>
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Thumbnail path (opsional)</div>
                <input className="input" placeholder="/abs/path/thumb.jpg" value={mThumbPath} onChange={(e) => setMThumbPath(e.target.value)} />
                <div className="small" style={{ marginTop: 6 }}>
                  Pilih dari Gallery Thumbnails:
                  <select className="input" style={{ marginTop: 6 }} onChange={(e) => chooseThumbPath(e.target.value, "manual")} value="">
                    <option value="">— pilih thumbnail —</option>
                    {galleryThumbs.slice(0, 80).map((f) => (
                      <option key={f.path} value={f.path}>{f.name} ({fmtBytes(f.size)})</option>
                    ))}
                  </select>
                  <div className="small" style={{ marginTop: 6 }}>
                    <a href="/gallery/thumbnails" style={{ textDecoration: "underline" }}>Buka Gallery Thumbnails</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid2">
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Judul</div>
                <input className="input" value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Judul video" required />
              </div>
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Tags (CSV)</div>
                <input className="input" value={mTags} onChange={(e) => setMTags(e.target.value)} placeholder="tag1, tag2, tag3" />
              </div>
            </div>

            <div>
              <div className="small" style={{ marginBottom: 6 }}>Deskripsi</div>
              <textarea className="input" style={{ minHeight: 140 }} value={mDescription} onChange={(e) => setMDescription(e.target.value)} placeholder="Deskripsi video" />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn2" type="submit">Upload sekarang</button>
              <button className="btn" type="button" onClick={aiFillManual}>AI Generate (Gemini SEO)</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Scheduler (WIB)</h2>

          <form onSubmit={doCreateSchedule} className="grid">
            <div className="grid grid2">
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Akun YouTube</div>
                <select className="input" value={sAccountId} onChange={(e) => setSAccountId(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      #{a.id} — {a.label} {a.channel_title ? `(${a.channel_title})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="small" style={{ marginBottom: 6 }}>Template (opsional)</div>
                <select className="input" value={sTemplateId} onChange={(e) => setSTemplateId(e.target.value)}>
                  <option value="">— tanpa template —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      #{t.id} — {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid2">
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Tanggal & Jam (WIB)</div>
                <input className="input" type="datetime-local" value={sRunAtLocal} onChange={(e) => setSRunAtLocal(e.target.value)} required />
                <div className="small" style={{ marginTop: 6 }}>
                  Cron jalan tiap 1 menit (WIB).
                </div>
              </div>
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Privacy</div>
                <select className="input" value={sPrivacy} onChange={(e) => setSPrivacy(e.target.value)}>
                  <option value="public">public</option>
                  <option value="unlisted">unlisted</option>
                  <option value="private">private</option>
                </select>
              </div>
            </div>

            <div className="grid grid2">
              <div>
                <div className="small" style={{ marginBottom: 6 }}>Video path (server)</div>
                <input className="input" placeholder="/abs/path/video.mp4" value={sVideoPath} onChange={(e) => setSVideoPath(e.target.value)} required />
                <div className="small" style={{ marginTop: 6 }}>
                  Pilih dari Gallery Videos:
                  <select className="input" style={{ marginTop: 6 }} onChange={(e) => chooseVideoPath(e.target.value, "schedule")} value="">
                    <option value="">— pilih video —</option>
                    {galleryVideos.slice(0, 80).map((f) => (
                      <option key={f.path} value={f.path}>{f.name} ({fmtBytes(f.size)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="small" style={{ marginBottom: 6 }}>Thumbnail path (opsional)</div>
                <input className="input" placeholder="/abs/path/thumb.jpg" value={sThumbPath} onChange={(e) => setSThumbPath(e.target.value)} />
                <div className="small" style={{ marginTop: 6 }}>
                  Pilih dari Gallery Thumbnails:
                  <select className="input" style={{ marginTop: 6 }} onChange={(e) => chooseThumbPath(e.target.value, "schedule")} value="">
                    <option value="">— pilih thumbnail —</option>
                    {galleryThumbs.slice(0, 80).map((f) => (
                      <option key={f.path} value={f.path}>{f.name} ({fmtBytes(f.size)})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn2" type="submit">Buat Schedule</button>
              <a className="btn" href="/templates">Kelola Template</a>
            </div>
          </form>

          <div style={{ height: 16 }} />

          <div className="card" style={{ background: "rgba(255,255,255,.02)" }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Jadwal</div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Akun</th>
                    <th>Run At (WIB)</th>
                    <th>Status</th>
                    <th>Video</th>
                    <th>Thumb</th>
                    <th>Error</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>
                        {s.account_label}
                        <div className="small">{s.template_name ? `Template: ${s.template_name}` : ""}</div>
                      </td>
                      <td>{s.run_at}</td>
                      <td><span className="badge">{s.status}</span></td>
                      <td className="small"><code>{s.video_path}</code></td>
                      <td className="small">{s.thumbnail_path ? <code>{s.thumbnail_path}</code> : "-"}</td>
                      <td className="small">{s.last_error || "-"}</td>
                      <td>
                        {(s.status === "queued" || s.status === "running") ? (
                          <button className="btn" onClick={() => cancelSchedule(s.id)}>Cancel</button>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                  {!schedules.length && <tr><td colSpan="8" className="small">Belum ada schedule.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Riwayat Uploads</div>
          <button
            className="btn"
            onClick={async () => {
              setMsg("Updating stats...");
              await fetch("/api/youtube/stats", { method: "POST" });
              await refreshUploadsAndSchedules();
              setMsg("Stats updated.");
            }}
          >
            Update Stats
          </button>
        </div>

        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Akun</th>
                <th>Video</th>
                <th>Status</th>
                <th>Privacy</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Log</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    {u.account_label}
                    <div className="small">{u.channel_title || ""}</div>
                  </td>
                  <td>
                    {u.video_id ? (
                      <a style={{ textDecoration: "underline" }} target="_blank" href={`https://www.youtube.com/watch?v=${u.video_id}`}>
                        {u.video_id}
                      </a>
                    ) : "-"}
                    <div className="small">{u.title || ""}</div>
                  </td>
                  <td><span className="badge">{u.status}</span></td>
                  <td className="small">{u.privacy || "-"}</td>
                  <td>{u.views ?? 0}</td>
                  <td>{u.likes ?? 0}</td>
                  <td>{u.comments ?? 0}</td>
                  <td className="small">{u.log || ""}</td>
                </tr>
              ))}
              {!uploads.length && <tr><td colSpan="9" className="small">Belum ada upload.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
