# Demo Script (10–15 min target)

A presenter's outline. Print this or have it on a second screen.

## Setup before you start (5 minutes before class)
- [ ] Live URL open in clean Chrome window (no extensions, no other tabs)
- [ ] Pre-seeded demo account already logged in (~30 days of data)
- [ ] Backup video tab ready
- [ ] Terminal open with: `git log --oneline -20` (already run)
- [ ] VS Code open with `AI_COLLABORATION.md` and `scripts/ralph-loop.ts` in side-by-side view
- [ ] Phone on silent
- [ ] Water nearby

---

## Slide 0 — Title (5 sec)
"Habit Tracker — capstone project for the Web App course. I'm [your name]."

---

## Section 1 — Hook (60 sec)

> "Show of hands — who's tried to build a habit, tracked it for two weeks, then forgot about it?"

(Wait for hands.)

> "Me too. I built this because the apps I tried were either too simple — just checkboxes — or too complicated, with social features I didn't want. I wanted something that did two things well: track my habits, and tell me each night what I should focus on tomorrow."

> "And to do the 'tell me what to focus on' part, I used a Claude Code technique called the Ralph Wiggum loop, which I'll show in a few minutes."

---

## Section 2 — Live demo (5 min)

### 2a. The dashboard (60 sec)
- Already logged in
- Point to:
  - List of 4 habits
  - Current streak next to each
  - The "Tomorrow's focus" card at the top (Ralph-generated)
  - The big "Done" buttons

> "This is my actual account. These are habits I've been tracking the past month."

### 2b. Check in a habit (30 sec)
- Click "Done" on one habit
- Show the streak number tick up
- Show the heatmap square fill in

### 2c. Heatmap (60 sec)
- Scroll to heatmap
- Hover over a few cells

> "GitHub-style heatmap, last 365 days. Each cell darker if I completed more habits that day. This is my favorite part — you can see at a glance whether you're consistent."

### 2d. Add a new habit (45 sec)
- Click "Add habit"
- Type in something funny like "Drink less coffee"
- Save
- Show it appears immediately

### 2e. Stats page (60 sec)
- Navigate to /stats
- Walk through the three big numbers + two charts

### 2f. Mobile view (30 sec)
- Open DevTools, toggle device toolbar
- Show responsive layout
- Close DevTools

### 2g. The Ralph-generated summary (60 sec)
- Back on dashboard, scroll to the summary card
- Read it out loud

> "This was written by Claude last night at 11pm UTC. It looked at the last 7 days of my data and wrote this. Tomorrow night it'll write a new one."

---

## Section 3 — Architecture (2.5 min)

Switch to your architecture diagram (one slide).

> "Three pieces. The Next.js app runs on Vercel. The database and auth are Supabase Postgres. And the Ralph Wiggum loop runs once a night as a Vercel Cron job."

> "I chose Supabase because magic-link auth is one function call and Postgres row-level security means I don't have to write authorization code in the app — the database enforces it."

> "I chose Next.js because Server Components mean the database query for 'today's habits' happens server-side. The browser never sees my Supabase keys."

(Optional: show the schema in 30 seconds. Three tables: habits, completions, daily_summaries.)

---

## Section 4 — Git + AI workflow (2.5 min)

Switch to terminal with `git log --oneline -20`.

> "I committed every day. 34 commits, feature branches for everything non-trivial."

(Open one PR on GitHub.)

> "I worked with Claude Code from day one. Every feature started as a GitHub issue, then I'd open Claude in the repo and describe what I wanted."

Switch to VS Code with `scripts/ralph-loop.ts`.

> "This is the Ralph Wiggum loop. The name is a reference to the Simpsons character — the idea is a small, dumb, autonomous process that runs continuously. No retries, no branching, no orchestration. Just: pull data, ask Claude, write the result, move on."

(Scroll through the file — 30 seconds max.)

> "At 11pm UTC, Vercel hits an endpoint that calls this function. It pulls the last 7 days of completions for every active user, asks Claude Haiku for a 3-sentence summary, and saves it."

Switch to `AI_COLLABORATION.md`.

> "I kept this document up to date as I went. It has my best prompts, my worst prompts, and the lessons from both."

---

## Section 5 — Lessons learned (90 sec)

Pick THREE honest ones. Examples:

> "First — getting deployment working on day one was the single best decision I made. Every feature went straight to production. I never had a 'works on my machine' bug."

> "Second — I tried to use Claude to write my database schema, and it suggested a normalized design with 6 tables. I pushed back, asked for the simplest possible 3-table version, and that's what I shipped. Claude is good but you still have to be the architect."

> "Third — the Ralph loop's prompts went through 8 revisions before the summaries felt natural. Specificity matters more than length."

---

## Section 6 — Q&A (2 min)

Expected questions and your prepared answers:

**Q: How much did the Anthropic API cost?**
A: About $0.005 per user per night using Haiku. I budgeted $5 for the whole project, used less than $2.

**Q: What would you add in v2?**
A: Push notifications. Mobile app via PWA. Timezone-aware cron so summaries arrive at user-local 11pm. Maybe social/accountability features.

**Q: Why not use Firebase or a custom Node backend?**
A: Postgres + RLS gave me real SQL with built-in authorization. Firebase's NoSQL would have made the streak calculation harder. A custom backend would have been more code to maintain for a 4-week project.

**Q: How did you handle the case where Claude returns a bad response?**
A: I don't validate the body — I trust it. If Claude returns nonsense, the user sees nonsense for one day, and the next night's run overwrites it. This is the Ralph spirit — keep it simple.

**Q: What was the hardest bug?**
A: The streak calculation. Timezones. Claude's first version didn't handle them. (Tell the story from your AI_COLLABORATION.md.)

---

## If something breaks during the demo

1. **Stay calm.** Say: "Looks like a hiccup — let me show you the recorded version."
2. Open the backup video tab.
3. Play from where you got stuck.
4. After the video, finish the rest of the demo from the recording.

The graders care that you have a recovery plan, not that nothing ever breaks. Acknowledging a problem gracefully is itself a sign of professional polish.
