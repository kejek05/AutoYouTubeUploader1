const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../../lib/auth");
const { db } = require("../../../../lib/db");

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db.prepare(`
    SELECT s.*, a.label as account_label, t.name as template_name
    FROM schedules s
    JOIN youtube_accounts a ON a.id=s.youtube_account_id
    LEFT JOIN templates t ON t.id=s.template_id
    WHERE s.user_id=?
    ORDER BY s.id DESC
    LIMIT 200
  `).all(user.id);
  return NextResponse.json({ schedules: rows });
}

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const ins = db.prepare(`
    INSERT INTO schedules(user_id,youtube_account_id,template_id,video_path,thumbnail_path,privacy,run_at,status)
    VALUES(?,?,?,?,?,?,?, 'queued')
  `).run(user.id, b.youtube_account_id, b.template_id || null, b.video_path, b.thumbnail_path || null, b.privacy || "private", b.run_at);
  return NextResponse.json({ ok: true, id: ins.lastInsertRowid });
}

async function DELETE(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  db.prepare("UPDATE schedules SET status='canceled' WHERE id=? AND user_id=?").run(id, user.id);
  return NextResponse.json({ ok: true });
}

module.exports = { GET, POST, DELETE };
