# AI Collaboration

This document records how Claude Code was used to build this project. It is a required deliverable for the course's "Process / AI usage" grading category (20%).

> **Tip to future-me:** fill this in as you go, not the week of the demo. The freshest examples are the best ones.

## Tools used

- **Claude Code CLI** — pair-programming throughout development
- **Project skill: `habit-coach`** — see [`.claude/skills/habit-coach.md`](.claude/skills/habit-coach.md). Used inside the app to generate habit suggestion templates.
- **Ralph Wiggum autonomous loop** — see `scripts/ralph-loop.ts`. Runs nightly via Vercel Cron to generate personalized summaries.

## Workflow

I used Claude Code from the first commit. My typical loop was:

1. Open a GitHub issue describing the feature
2. Open `claude` in the repo root
3. Describe the feature in plain English, including which files were involved
4. Review the diff before accepting
5. Run the dev server and test manually
6. Commit with a message Claude drafted, then I edited

I avoided letting Claude make decisions in three areas:
- **Database schema changes** — I always reviewed migrations myself
- **Auth/security logic** — I read every line
- **Dependencies** — I checked package counts and bundle size before adding any

## Prompts that worked well

> Fill these in during weeks 13–15. Aim for 5–10 examples by demo day.

### Example: scaffolding the heatmap component
**Prompt:**
> Build a `<Heatmap />` component that takes a list of `{ date: string, count: number }` and renders a GitHub-style calendar heatmap for the last 365 days. Use `react-calendar-heatmap`. Style it with Tailwind. Empty days should be gray-100, completed days green-500.

**Result:** Working in ~2 minutes.

**What I learned:** Being specific about the data shape and the visual outcome cut down on back-and-forth.

### Example: ___
(add more here as you go)

## Prompts that did NOT work well

> Be honest here — the "lessons learned" section of your demo will draw from this.

### Example: the streak calculation bug
**Prompt:**
> Write a function to calculate the current streak for a habit.

**Result:** Claude wrote a function that counted backwards from today but didn't account for the user's timezone, so streaks broke around midnight UTC for non-UTC users.

**What I learned:** When date/time logic is involved, I need to specify the timezone assumption explicitly. New prompt: "...assume all completion dates are stored in the user's local timezone as a `date` (not timestamp). Streak = consecutive days ending today."

### Example: ___
(add more here as you go)

## The Ralph Wiggum loop

I chose the Ralph Wiggum technique as my primary advanced Claude Code feature. The loop lives in `scripts/ralph-loop.ts` and runs via Vercel Cron at 11pm UTC.

**What it does:**
- Reads every active user's last 7 days of habit completions
- For each user, calls the Anthropic API with a prompt that includes their data
- Writes a personalized motivational summary + tomorrow's focus into `daily_summaries`
- The dashboard reads from this table and shows the summary in a card

**Why this counts as "Ralph":**
A Ralph loop is a small, dumb, autonomous process that does one thing repeatedly. Mine fits — no orchestration, no retries, no branching logic. Just: pull data, ask Claude, write result, move on. If something fails, the next run picks up where we left off.

**Lessons from building it:**
> (Fill in: what failed the first time, what you changed, what surprised you.)

## Skill: habit-coach

See [`.claude/skills/habit-coach.md`](.claude/skills/habit-coach.md).

The skill is used in two places:
1. In-app — when a user clicks "suggest habits" on the empty state, we invoke this skill via the API
2. While developing — I used it to generate seed data for testing

## Lessons Learned

> Save these for the demo. Aim for 3 honest takeaways. Examples:
> - One thing that worked better than expected
> - One thing that surprised me (good or bad)
> - One thing I'd do differently next time

1. ___
2. ___
3. ___
