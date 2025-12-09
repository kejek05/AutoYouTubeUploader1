const { NextResponse } = require("next/server");
const bcrypt = require("bcryptjs");
const { db } = require("../../../../lib/db");
const { setSessionCookie } = require("../../../../lib/auth");

async function POST(req) {
  const body = await req.json();
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!user) return NextResponse.json({ error: "Username/password salah" }, { status: 400 });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Username/password salah" }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, user.id);
  return res;
}

module.exports = { POST };
