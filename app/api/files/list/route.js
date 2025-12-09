const { NextResponse } = require("next/server");
const fs = require("fs");
const path = require("path");
const { getUserFromRequest } = require("../../../../lib/auth");

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const url = new URL(req.url);
  const kind = String(url.searchParams.get("kind") || "").trim(); // video|thumbnail
  if (!["video", "thumbnail"].includes(kind)) {
    return NextResponse.json({ error: "kind invalid" }, { status: 400 });
  }

  const uploadRoot = process.env.UPLOAD_DIR || "./uploads_storage";
  const sub = kind === "video" ? "videos" : "thumbnails";
  const dir = path.resolve(path.join(uploadRoot, sub));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const entries = fs
    .readdirSync(dir)
    .map((name) => {
      const full = path.join(dir, name);
      try {
        const st = fs.statSync(full);
        if (!st.isFile()) return null;
        return { name, size: st.size, path: path.resolve(full), mtime: st.mtimeMs };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  entries.sort((a, b) => b.mtime - a.mtime);

  return NextResponse.json({ files: entries.map(({mtime, ...rest}) => rest) });
}

module.exports = { GET };
