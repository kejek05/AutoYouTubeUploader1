const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../../lib/auth");
const { geminiGenerateSEO } = require("../../../../lib/gemini");

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const out = await geminiGenerateSEO(body);
  return NextResponse.json(out);
}

module.exports = { POST };
