import "./globals.css";

export const metadata = {
  title: "AutoYouTubeUploader",
  description: "Upload video YouTube manual & otomatis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="container">
          <Header />
          {children}
          <footer className="small" style={{ marginTop: 24, opacity: 0.7 }}>
            AutoYouTubeUploader • Next.js + SQLite • Cron WIB
          </footer>
        </div>
      </body>
    </html>
  );
}

function Header() {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>AutoYouTubeUploader</div>
          <div className="small">
            Manual upload • Scheduler • Multi-account • Gemini SEO
          </div>
          <ServerClock />
        </div>
        <nav className="nav">
          <a href="/dashboard">Dashboard</a>
          <a href="/uploads">Uploads</a>
          <a href="/templates">Templates</a>
          <a href="/accounts">Accounts</a>
          <a href="/gallery/videos">Gallery Videos</a>
          <a href="/gallery/thumbnails">Gallery Thumbnails</a>
          <a href="/settings">Settings</a>
          <a href="/sign-in">Sign In</a>
          <a href="/sign-up">Sign Up</a>
        </nav>
      </div>
    </div>
  );
}

function ServerClock() {
  // supaya tidak error hydration
  return (
    <span suppressHydrationWarning>
      <ClientClock />
    </span>
  );
}

function ClientClock() {
  "use client";
  const React = require("react");
  const { useEffect, useState } = React;
  const [t, setT] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/server-time", { cache: "no-store" });
      const j = await r.json();
      setT(j.text || "");
    } catch {
      setT("");
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, []);

  return t ? (
    <div className="small" style={{ marginTop: 6, opacity: 0.85 }}>
      Server time: <b>{t}</b>
    </div>
  ) : null;
}
