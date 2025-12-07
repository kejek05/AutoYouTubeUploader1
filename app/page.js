export default function Home() {
  return (
    <div className="card" style={{marginTop:16}}>
      <h2 style={{marginTop:0}}>Mulai cepat</h2>
      <ol>
        <li>Sign Up / Sign In</li>
        <li>Settings → isi GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI, GEMINI_API_KEY</li>
        <li>Accounts → Connect akun YouTube (multi-akun bisa)</li>
        <li>Uploads → Manual upload atau buat Schedule (WIB)</li>
      </ol>
      <p className="small">
        Catatan: versi ini memakai <b>path file</b> video/thumbnail di server (misalnya /home/ubuntu/videos/a.mp4).
        Jadi upload file ke VPS via SCP/SFTP dulu, lalu masukkan path-nya di UI.
      </p>
    </div>
  );
}
