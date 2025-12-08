const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../../../lib/auth");
const { getAuthUrl } = require("../../../../../lib/youtube");

async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const label = url.searchParams.get("label") || "YouTube Account";
  const state = Buffer.from(JSON.stringify({ userId: user.id, label })).toString("base64url");
  const authUrl = getAuthUrl(state);
  return NextResponse.redirect(authUrl);
}

module.exports = { GET };
