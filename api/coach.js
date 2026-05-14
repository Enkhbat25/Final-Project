// Vercel serverless function: POST /api/coach
// Proxies a wellness-snapshot to the Anthropic API and returns a short coach message.
// Keeps ANTHROPIC_API_KEY server-side — never exposed to the browser.

import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a warm, specific wellness coach. The user will send a JSON snapshot of their past week — habits completed, mood entries, sleep hours, focus minutes, and water intake.

Write a 4-sentence personalized response:
1. One specific observation from the data (cite a real number).
2. One strength to celebrate.
3. One focus area for tomorrow.
4. One concrete, small suggestion they can act on in under 5 minutes.

Rules:
- No emojis. No greetings like "Hi" or "Hey".
- No headers, no bullet points, no markdown.
- Use the user's actual data. Don't make up numbers.
- If the data is sparse, acknowledge it gently and suggest logging more.
- Be warm but not saccharine.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const snapshot = req.body?.snapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return res.status(400).json({ error: "missing or invalid snapshot" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "server not configured" });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(snapshot) }],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "";
    if (!text) {
      return res.status(502).json({ error: "empty response from model" });
    }

    return res.status(200).json({ text, model: message.model });
  } catch (err) {
    console.error("coach api error:", err);
    return res.status(500).json({ error: "coach unavailable" });
  }
}
