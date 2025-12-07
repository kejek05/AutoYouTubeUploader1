# AutoYouTubeUploader (Next.js + SQLite + Cron WIB)

Fitur:
- Sign Up / Sign In (session cookie)
- Settings (isi GOOGLE_CLIENT_ID/SECRET, Redirect URI, Gemini API)
- Multi akun YouTube (OAuth2 offline + refresh token otomatis)
- Manual upload video + set thumbnail (pakai path file di server)
- Schedule upload otomatis (WIB, cron tiap menit)
- Template metadata
- Gemini SEO generator (judul/deskripsi/tags)
- Dashboard statistik (views/likes/comments)

## 1) Install (VPS)
```bash
sudo apt update
sudo apt install -y git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Clone repo:
```bash
git clone https://github.com/USERNAME/AutoYouTubeUploader.git
cd AutoYouTubeUploader
npm install
cp .env.example .env
npm run db:init
npm run build
NODE_ENV=production npm run start
```

Run permanen (tanpa nginx) dengan PM2:
```bash
sudo npm i -g pm2
pm2 start server.js --name AutoYouTubeUploader
pm2 save
pm2 startup
```

Buka port 3000:
```bash
sudo ufw allow 3000/tcp
sudo ufw enable
```

## 2) Upload file video ke server
Aplikasi ini memakai **path file** video/thumbnail yang ada di server.
Upload file via SCP/SFTP ke VPS, contoh:
```bash
scp ./video.mp4 root@96.44.179.201:/home/root/videos/video.mp4
scp ./thumb.jpg root@96.44.179.201:/home/root/thumbs/thumb.jpg
```
Lalu isi di halaman **Uploads**:
- video_path: `/home/root/videos/video.mp4`
- thumbnail_path: `/home/root/thumbs/thumb.jpg` (opsional)

## 3) Setup Google OAuth + YouTube Data API v3
1. Google Cloud Console → buat Project
2. Enable **YouTube Data API v3**
3. OAuth consent screen (External)
4. Credentials → OAuth Client ID → Web application

Authorized redirect URI:
- `https://YOURDUCKDNS/api/youtube/oauth/callback`
  (kalau belum HTTPS bisa `http://...`)

Masukkan ke UI: **Settings**
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- OAUTH_REDIRECT_URI
- GEMINI_API_KEY

## 4) Connect YouTube Account
Menu **Accounts** → Connect YouTube → setujui permission.

Jika error `No refresh_token returned`:
- Buka Google Account → Security → Third-party access → remove akses aplikasi
- Connect lagi (harus prompt consent lagi).

## 5) Jadwal (WIB)
Menu **Uploads** → Schedule.
Format `run_at`:
- `YYYY-MM-DD HH:mm` (WIB), contoh `2025-12-08 21:30`

Cron berjalan tiap menit otomatis saat server start.
