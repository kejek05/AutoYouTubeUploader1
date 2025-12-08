const { NextResponse } = require("next/server");
const { db } = require("../../../lib/db");
const { getUserFromRequest } = require("../../../lib/auth");

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db.prepare("SELECT key, value FROM settings").all();
  const obj = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return NextResponse.json({ settings: obj });
}

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const entries = Object.entries(body || {});
  const stmt = db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
  const tx = db.transaction(() => entries.forEach(([k,v]) => stmt.run(k, String(v ?? ""))));
  tx();
  return NextResponse.json({ ok: true });
}

module.exports = { GET, POST };
