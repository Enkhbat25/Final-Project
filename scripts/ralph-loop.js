/**
 * Ralph Wiggum autonomous loop — generates wellness coach templates.
 *
 * The "Ralph Wiggum" technique: a small, dumb, deliberately simple loop that
 * does one thing repeatedly. No retries, no orchestration, no branching logic.
 * Named after the Simpsons character; the philosophy is at https://ghuntley.com/ralph/
 *
 * What this loop does:
 *   For each of three coaching styles (motivational, analytical, chill),
 *   ask the model to write a fallback template the app can show when the live
 *   /api/coach endpoint is unreachable. Templates are written to coach-templates/.
 *
 * Uses Groq (Llama 3.3 70B) via its OpenAI-compatible API.
 *
 * Usage:
 *   GROQ_API_KEY=gsk_... node scripts/ralph-loop.js
 */

import fs from "node:fs/promises";
import path from "node:path";

const STYLES = [
  {
    name: "motivational",
    instruction: "Write in an upbeat, encouraging tone. Celebrate effort. End on a forward-looking note."
  },
  {
    name: "analytical",
    instruction: "Write like a thoughtful data analyst. Be precise. Reference specific numbers. Less emotion."
  },
  {
    name: "chill",
    instruction: "Write in a calm, unhurried tone. Treat the user kindly. No pressure or hustle culture."
  }
];

const SAMPLE_SNAPSHOT = {
  range: "7 days",
  habits: [
    { name: "Read 20 minutes", completedThisWeek: 5, outOf: 7 },
    { name: "Walk outside", completedThisWeek: 6, outOf: 7 },
    { name: "Drink water before coffee", completedThisWeek: 3, outOf: 7 }
  ],
  moods: [
    { date: "2026-05-09", mood: "good" },
    { date: "2026-05-10", mood: "great" },
    { date: "2026-05-12", mood: "okay" },
    { date: "2026-05-13", mood: "good" }
  ],
  sleep: [
    { date: "2026-05-09", hours: 7.5 },
    { date: "2026-05-10", hours: 8.0 },
    { date: "2026-05-12", hours: 6.5 }
  ],
  focus: [
    { date: "2026-05-10", minutes: 75 },
    { date: "2026-05-13", minutes: 50 }
  ],
  water: [
    { date: "2026-05-09", ml: 1800 },
    { date: "2026-05-12", ml: 2200 }
  ],
  waterGoalMl: 2000
};

const BASE_SYSTEM = `You are a wellness coach. The user sent a JSON snapshot of their week.

Write a 4-sentence response:
1. One specific observation citing a real number.
2. One strength to celebrate.
3. One focus area for tomorrow.
4. One concrete sub-5-minute suggestion.

No emojis. No greetings. No headers. No markdown. Plain text only.`;

async function generateTemplate(apiKey, style) {
  const system = `${BASE_SYSTEM}\n\nStyle: ${style.instruction}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(SAMPLE_SNAPSHOT) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`groq api ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Missing GROQ_API_KEY in environment.");
    console.error("Set it in .env or pass it inline: GROQ_API_KEY=gsk_... node scripts/ralph-loop.js");
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "coach-templates");
  await fs.mkdir(outDir, { recursive: true });

  console.log("Ralph loop starting…");

  let ok = 0;
  let failed = 0;

  // The loop. No retries. No backoff. If a style fails, log and move on.
  for (const style of STYLES) {
    try {
      console.log(`  → generating ${style.name} template`);
      const text = await generateTemplate(apiKey, style);
      if (!text) throw new Error("empty response");

      const out = {
        style: style.name,
        generatedAt: new Date().toISOString(),
        sampleSnapshot: SAMPLE_SNAPSHOT,
        text
      };
      await fs.writeFile(
        path.join(outDir, `${style.name}.json`),
        JSON.stringify(out, null, 2)
      );
      console.log(`    ✓ wrote coach-templates/${style.name}.json`);
      ok++;
    } catch (err) {
      console.error(`    ✗ ${style.name} failed:`, err.message);
      failed++;
      // Ralph keeps going.
    }
  }

  console.log(`Ralph loop done. ok=${ok} failed=${failed}`);
  process.exit(failed > 0 && ok === 0 ? 1 : 0);
}

main();
