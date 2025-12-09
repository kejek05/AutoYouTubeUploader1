const { NextResponse } = require("next/server");

async function GET() {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  const pad = (n) => String(n).padStart(2, "0");
  const y = wib.getUTCFullYear();
  const m = pad(wib.getUTCMonth() + 1);
  const d = pad(wib.getUTCDate());
  const hh = pad(wib.getUTCHours());
  const mm = pad(wib.getUTCMinutes());
  const ss = pad(wib.getUTCSeconds());

  return NextResponse.json({
    iso: `${y}-${m}-${d}T${hh}:${mm}:${ss}+07:00`,
    text: `${y}-${m}-${d} ${hh}:${mm}:${ss} WIB`,
    unix: Math.floor(wib.getTime() / 1000),
  });
}

module.exports = { GET };
