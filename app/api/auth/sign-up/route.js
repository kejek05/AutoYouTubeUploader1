const { NextResponse } = require("next/server");
const bcrypt = require("bcryptjs");
const { db } = require("../../../../lib/db");
const { setSessionCookie } = require("../../../../lib/auth");

async function POST(req) {
  const body = await req.json();
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!username || username.length < 3 || password.length < 6) {
    return NextResponse.json({ error: "Username minimal 3 karakter & password minimal 6 karakter" }, { status: 400 });
  }

  const exists = db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if (exists) return NextResponse.json({ error: "Username sudah terdaftar" }, { status: 400 });

  const password_hash = await bcrypt.hash(password, 10);
  const ins = db.prepare("INSERT INTO users(username,password_hash) VALUES(?,?)").run(username, password_hash);

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, ins.lastInsertRowid);
  return res;
}

module.exports = { POST };
