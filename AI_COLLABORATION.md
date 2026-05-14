# AI Collaboration

This document records how Claude Code was used to build Zenith. It is a required deliverable for the course's "Process / AI usage" grading category (20%).

This is an honest account: the project was built in two distinct phases of Claude Code pair-programming, and most of the architectural and UI work originated from Claude. My role was to direct, review, accept or reject, and integrate.

## Tools used

- **Claude Code CLI** — pair-programming throughout, across two sessions
- **Project Skill: `wellness-coach`** — see [.claude/skills/wellness-coach.md](.claude/skills/wellness-coach.md). Defines the AI Coach's voice and output contract.
- **Live AI feature** — see [api/coach.js](api/coach.js). Vercel serverless function calling Claude Haiku 4.5.
- **Ralph Wiggum autonomous loop** — see [scripts/ralph-loop.js](scripts/ralph-loop.js). Local Node loop that generates fallback coach templates.

---

## Phase 1 — Core dashboard (prior Claude Code session)

The initial 8-feature dashboard (Habits, Focus, Planner, Mood, Water, Sleep, Insights, Badges) plus the XP system, light/dark theming, and module structure was built in an earlier Claude Code session. I worked with Claude to:

- Decide on vanilla JS over a framework (we discussed Next.js but rejected it as overengineered for a localStorage app).
- Design the 15-module structure in `app.js` (Utils → Storage → Toast → ThemeManager → XPSystem → Navigation → PageRenderer → feature modules).
- Settle on the localStorage schema with `zenith_*` key prefixes.
- Pick the design language: glassmorphism, Inter typeface, indigo (`#6366f1`) accent.

The output of that phase is the ~3,900 line `app.js` and the styled `index.html`. I reviewed each module before accepting it; the patterns are consistent because Claude held the conventions across the session.

## Phase 2 — AI Coach + deployment + docs (this session)

Today's session focused on the missing piece: integrating Claude Code's advanced features into the deployed app. Specifically:

1. Adding the live AI Coach (Vercel serverless function + frontend module).
2. Writing the Ralph Wiggum autonomous loop.
3. Authoring the `wellness-coach` Skill.
4. Rewriting README / ARCHITECTURE / AI_COLLABORATION to match reality (the prior docs described a Next.js app that never shipped).
5. Wiring up Vercel deployment.

I was the architect; Claude wrote most of the code. The key trade-offs (no retries, Haiku over Sonnet, integrate into Insights vs. its own tab) were my calls. Claude proposed alternatives and I picked.

---

## Prompts that worked well

### Building the AICoach frontend module
**Prompt (paraphrased):**
> I have an existing `Insights` module in `app.js` that calculates a productivity score and shows insight cards. Add a new `AICoach` module right after it. It should: (1) build a snapshot of the last 7 days from localStorage, (2) POST to /api/coach, (3) render the response in the same card style, (4) save the last 5 responses to localStorage under `zenith_coach_history`, (5) gracefully fall back to a local insight if the API is unreachable. Reuse existing `Toast`, `Storage`, `Utils` modules.

**What worked:** specifying exact reuse targets and the fallback requirement. Claude produced a working module in one shot.

### Writing the serverless function
**Prompt:**
> Write a Vercel serverless function at api/coach.js that accepts POST { snapshot }, calls claude-haiku-4-5-20251001 with a tight 4-sentence system prompt, and returns { text }. Validate the snapshot exists. Don't leak the API key. Return 405 for non-POST.

**What worked:** explicitly listing every requirement in one paragraph. No back-and-forth.

### Writing the Ralph loop
**Prompt:**
> Write a Node script `scripts/ralph-loop.js` that loops over three coaching styles (motivational, analytical, chill) and asks Claude Haiku to generate a fallback template for each. Output to coach-templates/{style}.json. No retries. If one fails, log and continue. This is the "Ralph Wiggum" technique — keep it deliberately dumb.

**What worked:** referencing the Ralph philosophy by name. Claude understood the intent: no orchestration, no backoff, no fancy logging.

---

## Prompts that did NOT work well

### First attempt at the AI Coach button
**First prompt:**
> Add an AI Coach button to the app.

**Result:** Claude added a button to the dashboard (wrong location), called the API without checking for sufficient data (would generate insights from an empty snapshot), and didn't save history. I had to redo the prompt with the specific integration point and requirements (see "worked well" above).

**Lesson:** "Add an X" is too vague for a 4000-line file. Specify the integration point, the data flow, and the failure modes.

### XPSystem method name
**Prompt:**
> Award XP when the user generates an AI Coach insight.

**Result:** Claude called `XPSystem.award(15, ...)` but the actual method is `XPSystem.addXP(15, ...)`. Easy bug, but a sign that even when Claude has read a file recently, it can fabricate plausible-sounding API names.

**Lesson:** before calling into an existing module, grep for the exact method name. Don't trust pattern-matching.

---

## The Wellness Coach Skill

[.claude/skills/wellness-coach.md](.claude/skills/wellness-coach.md) is a Skill file used in three places:

1. **As the system prompt foundation for `/api/coach`.** The serverless function inlines the core rules (4 sentences, no emojis, use real numbers, etc.) verbatim.
2. **As the input to the Ralph loop's tone variants.** The loop reads the skill's "Tone variants" section and generates one template per style.
3. **As a contributor guide.** Anyone extending the coach can read the skill rather than reverse-engineering tone from `api/coach.js`.

The Skill enforces the output contract that prevents the most common coach failure modes I saw during prompt iteration: emoji spam, vague platitudes, made-up numbers, and "hi! 👋 great job today!" greetings.

---

## The Ralph Wiggum loop

[scripts/ralph-loop.js](scripts/ralph-loop.js) demonstrates the autonomous-loop technique. The philosophy (https://ghuntley.com/ralph/) is that small, deliberately simple loops are more robust than orchestrated ones.

What it does:
- Loops over three tone variants
- For each, calls Claude Haiku with a sample snapshot
- Writes the response to `coach-templates/{tone}.json`
- On failure: logs the error and moves on. No retries. The next run tries again.

Why this counts as Ralph:
- ~100 lines total
- No state machine
- No retry policy
- No queue, no concurrency control
- One small thing, done three times, no apologies

**Demo move:** running `npm run ralph` in the terminal during the presentation generates new templates in real time. It's a clean visual of "Claude as an autonomous worker" without the complexity of a real production loop.

---

## Lessons Learned

1. **Direct, don't dictate, and don't abdicate.** The best prompts gave Claude the goal, the integration point, and the constraints — but left the implementation details to it. Prompts that were too vague produced bloat; prompts that micromanaged the code lost Claude's existing context about the codebase.

2. **Reuse > rebuild.** When I discovered the Zenith dashboard had already been built in a prior session, the right move was to add features, not rewrite. The temptation to "start fresh" with Next.js would have produced something much worse in the time available. Recognizing the existing code's value was the highest-leverage decision in this project.

3. **Graceful degradation matters more than I expected.** Adding a `localFallback()` to the AI Coach means the demo works even if Vercel goes down. It's also a more honest UX — the app doesn't pretend to be smart when it can't reach the AI. Cheap to write, expensive to skip.
