const { db } = require("./db");

  function getSetting(key) {
    return db.prepare("SELECT value FROM settings WHERE key=?").get(key)?.value || "";
  }

  async function geminiGenerateSEO({ topic, language = "id", style = "SEO", extra = "" }) {
    const key = getSetting("GEMINI_API_KEY");
    if (!key) throw new Error("GEMINI_API_KEY not set in Settings");

    const prompt = `
Buat metadata YouTube yang ${style} dalam bahasa ${language}.
Topik: ${topic}
Konteks tambahan: ${extra}

Kembalikan JSON valid saja dengan format:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "...", "..."]
}
`.trim();

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6 },
        }),
      }
    );

    const json = await resp.json();
    if (!resp.ok) throw new Error(json?.error?.message || "Gemini error");

    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    const sliced = first >= 0 ? text.slice(first, last + 1) : text;
    return JSON.parse(sliced);
  }

  module.exports = { geminiGenerateSEO };
