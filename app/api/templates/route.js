const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../lib/auth");
const { db } = require("../../../lib/db");

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = db.prepare("SELECT * FROM templates WHERE user_id=? ORDER BY id DESC").all(user.id);
  return NextResponse.json({ templates: rows });
}

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const ins = db.prepare(`
    INSERT INTO templates(user_id,name,title_tpl,description_tpl,tags_csv)
    VALUES(?,?,?,?,?)
  `).run(user.id, b.name||"Template", b.title_tpl||"", b.description_tpl||"", b.tags_csv||"");
  return NextResponse.json({ ok: true, id: ins.lastInsertRowid });
}

async function PUT(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  db.prepare(`
    UPDATE templates SET name=?, title_tpl=?, description_tpl=?, tags_csv=?
    WHERE id=? AND user_id=?
  `).run(b.name||"", b.title_tpl||"", b.description_tpl||"", b.tags_csv||"", b.id, user.id);
  return NextResponse.json({ ok: true });
}

async function DELETE(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  db.prepare("DELETE FROM templates WHERE id=? AND user_id=?").run(id, user.id);
  return NextResponse.json({ ok: true });
}

module.exports = { GET, POST, PUT, DELETE };
