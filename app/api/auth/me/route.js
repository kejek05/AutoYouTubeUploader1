const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../../lib/auth");

async function GET(req) {
  const user = getUserFromRequest(req);
  return NextResponse.json({ user: user || null });
}

module.exports = { GET };
