export default function Home() {
  return (
    <div className="card" style={{marginTop:16}}>
      <h2 style={{marginTop:0}}>Mulai cepat</h2>
      <ol>
        <li>Sign Up / Sign In (username + password)</li>
        <li>Settings → isi GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI, GEMINI_API_KEY</li>
        <li>Accounts → Connect akun YouTube (multi-akun bisa)</li>
        <li>Uploads → Manual upload atau buat Schedule (WIB)</li>
      </ol>
      <p className="small">
        Versi ini punya menu <b>Gallery</b> untuk upload video/thumbnail ke VPS, lalu copy path ke menu Uploads.
      </p>
    </div>
  );
}
