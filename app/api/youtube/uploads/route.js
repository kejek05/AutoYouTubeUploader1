const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../../lib/auth");
const { db } = require("../../../../lib/db");

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = db.prepare(`
    SELECT u.*, a.label as account_label, a.channel_title
    FROM uploads u
    JOIN youtube_accounts a ON a.id=u.youtube_account_id
    WHERE u.user_id=?
    ORDER BY u.id DESC
    LIMIT 200
  `).all(user.id);
  return NextResponse.json({ uploads: rows });
}

module.exports = { GET };
