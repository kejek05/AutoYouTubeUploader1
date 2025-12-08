const fs = require("fs");
const { db } = require("./db");
const { getYouTubeClientFromAccount } = require("./youtube");

async function runScheduleNow(scheduleId) {
  const s = db.prepare("SELECT * FROM schedules WHERE id=?").get(scheduleId);
  if (!s || s.status !== "queued") return;

  db.prepare("UPDATE schedules SET status='running', last_error=NULL WHERE id=?").run(scheduleId);

  const tpl = s.template_id ? db.prepare("SELECT * FROM templates WHERE id=?").get(s.template_id) : null;

  const title = tpl?.title_tpl || "Untitled";
  const description = tpl?.description_tpl || "";
  const tagsCsv = tpl?.tags_csv || "";

  const upIns = db.prepare(`
    INSERT INTO uploads(user_id,youtube_account_id,schedule_id,title,privacy,status,log)
    VALUES(?,?,?,?,?,?,?)
  `).run(s.user_id, s.youtube_account_id, scheduleId, title, s.privacy, "running", "Cron upload started");

  try {
    const { youtube } = await getYouTubeClientFromAccount(s.youtube_account_id);

    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags: tagsCsv.split(",").map(t => t.trim()).filter(Boolean),
          categoryId: "22",
        },
        status: { privacyStatus: s.privacy },
      },
      media: { body: fs.createReadStream(s.video_path) },
    });

    const videoId = res.data.id;

    if (s.thumbnail_path) {
      await youtube.thumbnails.set({
        videoId,
        media: { body: fs.createReadStream(s.thumbnail_path) },
      });
    }

    db.prepare("UPDATE uploads SET status='success', video_id=?, log=? WHERE id=?")
      .run(videoId, `Cron uploaded OK: ${videoId}`, upIns.lastInsertRowid);

    db.prepare("UPDATE schedules SET status='success' WHERE id=?").run(scheduleId);
  } catch (e) {
    const msg = String(e?.message || e);
    db.prepare("UPDATE uploads SET status='failed', log=? WHERE id=?").run(msg, upIns.lastInsertRowid);
    db.prepare("UPDATE schedules SET status='failed', last_error=? WHERE id=?").run(msg, scheduleId);
  }
}

module.exports = { runScheduleNow };
