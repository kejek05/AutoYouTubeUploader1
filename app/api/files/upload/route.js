const { NextResponse } = require("next/server");
const fs = require("fs");
const path = require("path");
const { getUserFromRequest } = require("../../../../lib/auth");

function safeName(name) {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 160);
}

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const form = await req.formData();
  const kind = String(form.get("kind") || "").trim(); // "video" | "thumbnail"
  const file = form.get("file");

  if (!["video", "thumbnail"].includes(kind)) {
    return NextResponse.json({ error: "kind invalid" }, { status: 400 });
  }
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const uploadRoot = process.env.UPLOAD_DIR || "./uploads_storage";
  const sub = kind === "video" ? "videos" : "thumbnails";
  const dir = path.join(uploadRoot, sub);
  fs.mkdirSync(dir, { recursive: true });

  const original = safeName(file.name);
  const ext = path.extname(original) || (kind === "video" ? ".mp4" : ".jpg");
  const baseName = path.basename(original, path.extname(original));
  const stamp = Date.now();
  const finalName = `${baseName}_${stamp}${ext}`;
  const fullPath = path.resolve(path.join(dir, finalName));

  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(fullPath, buf);

  return NextResponse.json({
    ok: true,
    name: finalName,
    size: buf.length,
    path: fullPath,
    kind,
  });
}

module.exports = { POST };
