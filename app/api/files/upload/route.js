const { NextResponse } = require("next/server");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getUserFromRequest } = require("../../../../lib/auth");

function safeExt(name = "") {
  const ext = path.extname(name).toLowerCase();
  return ext.replace(/[^a-z0-9.]/g, "");
}
function safeBase(name = "") {
  const base = path.basename(name, path.extname(name));
  return base.replace(/[^a-z0-9-_]/gi, "_").slice(0, 80);
}

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "video");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File wajib" }, { status: 400 });
  }

  const MAX = 500 * 1024 * 1024;
  if (file.size > MAX) {
    return NextResponse.json({ error: "File terlalu besar (max 500MB)" }, { status: 400 });
  }

  const uploadRoot = process.env.UPLOAD_DIR || "./uploads_storage";
  const sub = kind === "thumbnail" ? "thumbnails" : "videos";
  const dir = path.join(uploadRoot, sub);
  fs.mkdirSync(dir, { recursive: true });

  const ext = safeExt(file.name);
  const base = safeBase(file.name);
  const rand = crypto.randomBytes(6).toString("hex");
  const filename = `${Date.now()}_${base}_${rand}${ext || ""}`;
  const outPath = path.join(dir, filename);

  const ab = await file.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(ab));

  const abs = path.resolve(outPath);
  return NextResponse.json({ ok: true, path: abs, filename, kind });
}

module.exports = { POST };
