const { NextResponse } = require("next/server");
const { getUserFromRequest } = require("../../../../lib/auth");
const { db } = require("../../../../lib/db");
const { getYouTubeClientFromAccount } = require("../../../../lib/youtube");

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // refresh stats per account (simple)
  const accounts = db.prepare("SELECT id FROM youtube_accounts WHERE user_id=?").all(user.id);
  for (const a of accounts) {
    const ids = db.prepare("SELECT id, video_id FROM uploads WHERE user_id=? AND youtube_account_id=? AND video_id IS NOT NULL ORDER BY id DESC LIMIT 50")
      .all(user.id, a.id)
      .map(r => r.video_id);

    if (!ids.length) continue;

    const { youtube } = await getYouTubeClientFromAccount(a.id);
    const res = await youtube.videos.list({ part: ["statistics"], id: ids });

    const items = res.data.items || [];
    const statById = new Map(items.map(it => [it.id, it.statistics]));

    const upd = db.prepare("UPDATE uploads SET views=?, likes=?, comments=? WHERE user_id=? AND video_id=?");
    const tx = db.transaction(() => {
      for (const vid of ids) {
        const st = statById.get(vid);
        if (!st) continue;
        upd.run(
          Number(st.viewCount || 0),
          Number(st.likeCount || 0),
          Number(st.commentCount || 0),
          user.id,
          vid
        );
      }
    });
    tx();
  }

  return NextResponse.json({ ok: true });
}

module.exports = { POST };
