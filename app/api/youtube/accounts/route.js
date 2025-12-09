const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../../lib/auth");
const { db } = require("../../../../lib/db");

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db.prepare("SELECT id,label,channel_id,channel_title,created_at FROM youtube_accounts WHERE user_id=? ORDER BY id DESC").all(user.id);
  return NextResponse.json({ accounts: rows });
}

async function DELETE(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  db.prepare("DELETE FROM youtube_accounts WHERE id=? AND user_id=?").run(id, user.id);
  return NextResponse.json({ ok: true });
}

module.exports = { GET, DELETE };
