import "./globals.css";

export const metadata = { title: "AutoYouTubeUploader", description: "Upload video YouTube manual & otomatis" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="container">
          <Header />
          {children}
          <footer className="small" style={{marginTop:24,opacity:.7}}>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800}}>AutoYouTubeUploader</div>
          <div className="small">Manual upload • Scheduler • Multi-account • Gemini SEO</div>
        </div>
        <nav className="nav">
          <a href="/dashboard">Dashboard</a>
          <a href="/uploads">Uploads</a>
          <a href="/templates">Templates</a>
          <a href="/accounts">Accounts</a>
          <a href="/settings">Settings</a>
          <a href="/sign-in">Sign In</a>
        </nav>
      </div>
    </div>
  );
}
