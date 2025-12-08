const { NextResponse } = require("next/server");
const fs = require("fs");
const path = require("path");
const { getUserFromRequest } = require("../../../../lib/auth");

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const target = String(body.path || "");
  if (!target) return NextResponse.json({ error: "path wajib" }, { status: 400 });

  const root = path.resolve(process.env.UPLOAD_DIR || "./uploads_storage");
  const full = path.resolve(target);

  if (!full.startsWith(root)) {
    return NextResponse.json({ error: "Forbidden path" }, { status: 403 });
  }

  if (fs.existsSync(full)) fs.unlinkSync(full);
  return NextResponse.json({ ok: true });
}

module.exports = { POST };
