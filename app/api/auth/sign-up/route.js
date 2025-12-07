const { NextResponse } = require("next/server");
const bcrypt = require("bcryptjs");
const { db } = require("../../../../lib/db");
const { setSessionCookie } = require("../../../../lib/auth");

async function POST(req) {
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || password.length < 6) {
    return NextResponse.json({ error: "Email wajib & password minimal 6 karakter" }, { status: 400 });
  }

  const exists = db.prepare("SELECT id FROM users WHERE email=?").get(email);
  if (exists) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });

  const password_hash = await bcrypt.hash(password, 10);
  const ins = db.prepare("INSERT INTO users(email,password_hash) VALUES(?,?)").run(email, password_hash);

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, ins.lastInsertRowid);
  return res;
}

module.exports = { POST };
