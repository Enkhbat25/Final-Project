/**
 * Ralph Wiggum nightly loop.
 *
 * For every active user with completions in the last 7 days, ask Claude to
 * write a 3-sentence personalized summary + tomorrow's focus, then UPSERT it
 * into `daily_summaries`.
 *
 * Run locally:   npm run ralph
 * Run in prod:   triggered by Vercel Cron via /api/cron/nightly-summaries
 *
 * Design notes (the "Ralph" spirit):
 *   - No retries, no backoff, no orchestration.
 *   - If a user fails, log and continue. Tomorrow's run tries again.
 *   - One small thing, done repeatedly.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const DRY_RUN = process.env.RALPH_DRY_RUN === "true";

if (!SUPABASE_URL || !SERVICE_KEY || !ANTHROPIC_KEY) {
  console.error("Missing required env vars. See .env.example");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

type Habit = { id: string; name: string };
type Completion = { habit_id: string; date: string };

async function getActiveUserIds(): Promise<string[]> {
  // "Active" = at least one completion in the last 7 days.
  const since = isoDate(daysAgo(7));
  const { data, error } = await supabase
    .from("completions")
    .select("user_id")
    .gte("date", since);

  if (error) throw error;
  return Array.from(new Set((data ?? []).map((r) => r.user_id as string)));
}

async function getUserWeek(userId: string) {
  const since = isoDate(daysAgo(7));

  const habitsRes = await supabase
    .from("habits")
    .select("id, name")
    .eq("user_id", userId)
    .is("archived_at", null);

  const completionsRes = await supabase
    .from("completions")
    .select("habit_id, date")
    .eq("user_id", userId)
    .gte("date", since);

  if (habitsRes.error) throw habitsRes.error;
  if (completionsRes.error) throw completionsRes.error;

  return {
    habits: (habitsRes.data ?? []) as Habit[],
    completions: (completionsRes.data ?? []) as Completion[],
  };
}

function buildPrompt(habits: Habit[], completions: Completion[]) {
  const byHabit = new Map<string, string[]>();
  for (const c of completions) {
    const arr = byHabit.get(c.habit_id) ?? [];
    arr.push(c.date);
    byHabit.set(c.habit_id, arr);
  }

  const lines = habits.map((h) => {
    const dates = (byHabit.get(h.id) ?? []).sort();
    return `- ${h.name}: ${dates.length}/7 days (${dates.join(", ") || "none"})`;
  });

  return `Here is a user's habit progress over the past 7 days:

${lines.join("\n")}

Write a short, warm, personalized summary in 3 sentences MAX. Be specific —
reference one habit they did well on and one to focus on tomorrow.

End with a single sentence starting "Tomorrow:" suggesting one concrete focus.

No emojis. No greetings like "Hi" or "Hello". Just the message body.`;
}

async function generateSummary(habits: Habit[], completions: Completion[]) {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: buildPrompt(habits, completions) }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response shape");
  return block.text.trim();
}

async function upsertSummary(userId: string, forDate: string, body: string) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] ${userId} for ${forDate}:\n${body}\n`);
    return;
  }
  const { error } = await supabase
    .from("daily_summaries")
    .upsert(
      { user_id: userId, for_date: forDate, body },
      { onConflict: "user_id,for_date" },
    );
  if (error) throw error;
}

export async function runRalphLoop() {
  const tomorrow = isoDate(daysAgo(-1));
  console.log(`Ralph loop starting for ${tomorrow}`);

  const userIds = await getActiveUserIds();
  console.log(`Found ${userIds.length} active users`);

  let ok = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const { habits, completions } = await getUserWeek(userId);
      if (habits.length === 0) continue;
      const body = await generateSummary(habits, completions);
      await upsertSummary(userId, tomorrow, body);
      ok++;
    } catch (err) {
      failed++;
      console.error(`Failed for user ${userId}:`, err);
      // Ralph keeps going. Tomorrow's run will try again.
    }
  }

  console.log(`Ralph loop done. ok=${ok} failed=${failed}`);
  return { ok, failed };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Allow running as: npm run ralph
if (require.main === module) {
  runRalphLoop()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
