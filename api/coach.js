// Vercel serverless function: POST /api/coach
// Proxies a wellness-snapshot to the Groq API (Llama 3.3 70B) and returns a short coach message.
// Keeps GROQ_API_KEY server-side — never exposed to the browser.

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
- Be warm but not saccharine.
- Plain text only. Exactly 4 sentences.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const snapshot = req.body?.snapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return res.status(400).json({ error: "missing or invalid snapshot" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "server not configured" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(snapshot) },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("groq api non-200:", response.status, errBody);
      return res.status(502).json({ error: "model unavailable" });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return res.status(502).json({ error: "empty response from model" });
    }

    return res.status(200).json({ text, model: data.model });
  } catch (err) {
    console.error("coach api error:", err);
    return res.status(500).json({ error: "coach unavailable" });
  }
}
