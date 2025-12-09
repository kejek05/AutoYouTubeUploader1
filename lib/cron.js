const cron = require("node-cron");
const { db } = require("./db");
const { runScheduleNow } = require("./runner");

let started = false;

function startCron() {
  if (started) return;
  started = true;

  cron.schedule("* * * * *", async () => {
    const due = db.prepare(`
      SELECT * FROM schedules
      WHERE status='queued' AND datetime(run_at) <= datetime('now', '+7 hours')
      ORDER BY run_at ASC
      LIMIT 5
    `).all();

    for (const s of due) {
      await runScheduleNow(s.id).catch(() => {});
    }
  }, { timezone: "Asia/Jakarta" });

  console.log("Cron scheduler started (Asia/Jakarta)");
}

module.exports = { startCron };
