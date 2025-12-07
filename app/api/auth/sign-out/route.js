const { NextResponse } = require("next/server");
const { clearSessionCookie } = require("../../../../lib/auth");

async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}

module.exports = { POST };
