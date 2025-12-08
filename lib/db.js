const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = process.env.SQLITE_PATH || "./data/autoyoutubeuploader.db";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);

function initDb() {
  const schema = fs.readFileSync(path.join(process.cwd(), "lib/schema.sql"), "utf8");
  db.exec(schema);
}

module.exports = { db, initDb };
