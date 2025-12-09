const { NextResponse } = require("next/server");
const fs = require("fs");
const { getUserFromRequest } = require("../../../../lib/auth");
const { db } = require("../../../../lib/db");
const { getYouTubeClientFromAccount } = require("../../../../lib/youtube");

async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { youtube_account_id, video_path, title, description, tags, privacy, thumbnail_path } = body;

  const acc = db.prepare("SELECT * FROM youtube_accounts WHERE id=? AND user_id=?").get(youtube_account_id, user.id);
  if (!acc) return NextResponse.json({ error: "Bad account" }, { status: 400 });

  const upIns = db.prepare(`
    INSERT INTO uploads(user_id,youtube_account_id,title,privacy,status,log)
    VALUES(?,?,?,?,?,?)
  `).run(user.id, youtube_account_id, title || "", privacy || "private", "running", "Starting upload...");

  try {
    if (!fs.existsSync(video_path)) throw new Error("video_path tidak ditemukan di server");
    if (thumbnail_path && !fs.existsSync(thumbnail_path)) throw new Error("thumbnail_path tidak ditemukan di server");

    const { youtube } = await getYouTubeClientFromAccount(youtube_account_id);

    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title || "Untitled",
          description: description || "",
          tags: String(tags || "").split(",").map(s => s.trim()).filter(Boolean),
          categoryId: "22",
        },
        status: { privacyStatus: privacy || "private" },
      },
      media: { body: fs.createReadStream(video_path) },
    });

    const videoId = res.data.id;

    if (thumbnail_path) {
      await youtube.thumbnails.set({
        videoId,
        media: { body: fs.createReadStream(thumbnail_path) },
      });
    }

    db.prepare("UPDATE uploads SET status='success', video_id=?, log=? WHERE id=?")
      .run(videoId, `Uploaded OK: ${videoId}`, upIns.lastInsertRowid);

    return NextResponse.json({ ok: true, videoId });
  } catch (e) {
    db.prepare("UPDATE uploads SET status='failed', log=? WHERE id=?")
      .run(String(e?.message || e), upIns.lastInsertRowid);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

module.exports = { POST };
