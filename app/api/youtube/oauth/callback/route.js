const { NextResponse } = require("next/server");
const { db } = require("../../../../../lib/db");
const { exchangeCodeForTokens, fetchChannelInfo } = require("../../../../../lib/youtube");

async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "Missing code/state" }, { status: 400 });

  const { userId, label } = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  const tokens = await exchangeCodeForTokens(code);

  if (!tokens.refresh_token) {
    return NextResponse.json({
      error: "No refresh_token returned. Revoke app access on Google Account then reconnect, or ensure prompt=consent."
    }, { status: 400 });
  }

  const ins = db.prepare(`
    INSERT INTO youtube_accounts(user_id,label,refresh_token,access_token,token_expiry)
    VALUES(?,?,?,?,?)
  `).run(userId, label, tokens.refresh_token, tokens.access_token || null, tokens.expiry_date || null);

  const accountId = ins.lastInsertRowid;
  const info = await fetchChannelInfo(accountId);

  db.prepare("UPDATE youtube_accounts SET channel_id=?, channel_title=? WHERE id=?")
    .run(info.channel_id, info.channel_title, accountId);

  return NextResponse.redirect(`${process.env.BASE_URL || ""}/accounts`);
}

module.exports = { GET };
