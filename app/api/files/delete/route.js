const { NextResponse } = require("next/server");
const fs = require("fs");
const path = require("path");
const { getUserFromRequest } = require("../../../../lib/auth");

function safeInside(baseDir, targetPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  return target.startsWith(base + path.sep);
}

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const body = await req.json();
  const p = String(body.path || "").trim();
  if (!p) return NextResponse.json({ error: "path required" }, { status: 400 });

  const uploadRoot = process.env.UPLOAD_DIR || "./uploads_storage";
  if (!safeInside(uploadRoot, p)) {
    return NextResponse.json({ error: "forbidden path" }, { status: 403 });
  }

  try {
    if (!fs.existsSync(p)) return NextResponse.json({ error: "file not found" }, { status: 404 });
    const st = fs.statSync(p);
    if (!st.isFile()) return NextResponse.json({ error: "not a file" }, { status: 400 });
    fs.unlinkSync(p);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

module.exports = { POST };
