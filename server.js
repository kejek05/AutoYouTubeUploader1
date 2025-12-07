const { createServer } = require("http");
const next = require("next");

// WIB timezone for cron & date formatting
process.env.TZ = "Asia/Jakarta";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const { startCron } = require("./lib/cron");
  const { initDb } = require("./lib/db");
  initDb();
  startCron();

  const port = process.env.PORT || 3000;
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`AutoYouTubeUploader running on :${port}`);
  });
});
