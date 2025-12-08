const { NextResponse } = require("next/server");
const fs = require("fs");
const path = require("path");
const { getUserFromRequest } = require("../../../../lib/auth");

function listDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((name) => {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (!st.isFile()) return null;
      return {
        name,
        path: path.resolve(full),
        size: st.size,
        mtime: st.mtimeMs,
      };
    })
    .filter(Boolean)
    .sort((a,b) => b.mtime - a.mtime);
}

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || "video";

  const root = process.env.UPLOAD_DIR || "./uploads_storage";
  const dir = path.join(root, kind === "thumbnail" ? "thumbnails" : "videos");

  return NextResponse.json({ files: listDir(dir) });
}

module.exports = { GET };
