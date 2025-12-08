const crypto = require("crypto");
const { db } = require("./db");

function sign(data, secret) {
  const h = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${data}.${h}`;
}
function verify(signed, secret) {
  const parts = String(signed || "").split(".");
  if (parts.length !== 2) return null;
  const [data, h] = parts;
  const h2 = crypto.createHmac("sha256", secret).update(data).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(h2)) ? data : null;
  } catch {
    return null;
  }
}

function setSessionCookie(res, userId) {
  const secret = process.env.SESSION_SECRET || "dev_secret_change_me";
  const payload = JSON.stringify({ userId, t: Date.now() });
  const b64 = Buffer.from(payload).toString("base64url");
  const signed = sign(b64, secret);

  res.cookies.set("session", signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.BASE_URL || "").startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function clearSessionCookie(res) {
  res.cookies.set("session", "", { path: "/", maxAge: 0 });
}

function getUserFromRequest(req) {
  const secret = process.env.SESSION_SECRET || "dev_secret_change_me";
  const cookie = req.cookies.get("session")?.value;
  if (!cookie) return null;
  const b64 = verify(cookie, secret);
  if (!b64) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const user = db.prepare("SELECT id, username FROM users WHERE id=?").get(payload.userId);
  return user || null;
}

module.exports = { setSessionCookie, clearSessionCookie, getUserFromRequest };
