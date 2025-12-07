const { google } = require("googleapis");
const { db } = require("./db");

function getSetting(key) {
  return db.prepare("SELECT value FROM settings WHERE key=?").get(key)?.value || "";
}

function makeOAuthClient() {
  const clientId = getSetting("GOOGLE_CLIENT_ID");
  const clientSecret = getSetting("GOOGLE_CLIENT_SECRET");
  const redirectUri = getSetting("OAUTH_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Settings missing: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or OAUTH_REDIRECT_URI");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getAuthUrl(state) {
  const oauth2 = makeOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    state,
  });
}

async function exchangeCodeForTokens(code) {
  const oauth2 = makeOAuthClient();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

async function getYouTubeClientFromAccount(accountId) {
  const acc = db.prepare("SELECT * FROM youtube_accounts WHERE id=?").get(accountId);
  if (!acc) throw new Error("Account not found");

  const oauth2 = makeOAuthClient();
  oauth2.setCredentials({
    refresh_token: acc.refresh_token,
    access_token: acc.access_token || undefined,
    expiry_date: acc.token_expiry || undefined,
  });

  oauth2.on("tokens", (tokens) => {
    if (tokens.access_token) {
      db.prepare("UPDATE youtube_accounts SET access_token=?, token_expiry=? WHERE id=?")
        .run(tokens.access_token, tokens.expiry_date || null, accountId);
    }
    if (tokens.refresh_token) {
      db.prepare("UPDATE youtube_accounts SET refresh_token=? WHERE id=?")
        .run(tokens.refresh_token, accountId);
    }
  });

  const youtube = google.youtube({ version: "v3", auth: oauth2 });
  return { youtube, oauth2 };
}

async function fetchChannelInfo(accountId) {
  const { youtube } = await getYouTubeClientFromAccount(accountId);
  const me = await youtube.channels.list({ part: ["snippet"], mine: true });
  const ch = me.data.items?.[0];
  return {
    channel_id: ch?.id || null,
    channel_title: ch?.snippet?.title || null,
  };
}

module.exports = { makeOAuthClient, getAuthUrl, exchangeCodeForTokens, getYouTubeClientFromAccount, fetchChannelInfo };
