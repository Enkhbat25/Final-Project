# Demo Script — Zenith (10–12 min)

A presenter's outline. Print this or keep it on a second screen.

## Setup (5 min before class)

- [ ] Live URL open in clean Chrome window
- [ ] Pre-seeded localStorage with ~14 days of data (use the data-seeding bookmarklet — see end of this doc)
- [ ] Dark mode toggle ready
- [ ] Backup video tab open (recorded yesterday)
- [ ] Terminal open with these tabs ready:
  - `git log --oneline` already run
  - `npm run ralph` ready to type (don't run yet)
  - `cat .claude/skills/wellness-coach.md` ready
- [ ] VS Code open showing `api/coach.js` and `scripts/ralph-loop.js` side by side
- [ ] Phone on silent, water nearby

---

## 0:00 — Title (5 sec)
"Zenith — a personal wellness dashboard. I'm Enkhbat. This is my capstone for the Web App course."

## 0:05 – 1:00 — Hook
> "Most habit-tracking apps do one thing. Most wellness apps want a subscription. I wanted something that combined habits, mood, sleep, focus, water — all my daily wellness signals — into one local-first dashboard, plus an AI coach that reads the data and tells me what to focus on tomorrow."

> "Eight features in one app, all offline-first, with a Claude-powered coaching layer on top. Let me show you."

## 1:00 – 6:30 — Live demo (the meat)

Click through each feature. Spend ~40 seconds on each.

### 1:00 — Dashboard
- "This is what I see when I open the app. Today's habit progress, water intake, focus minutes, sleep, mood."
- Point out the GitHub-style heatmap.

### 1:40 — Habits
- Show 4 active habits with streaks.
- Check off one habit. Toast notification fires. XP awarded.
- "One-click check-in. Streak updates in real time."

### 2:20 — Focus Mode
- Set a 25-minute timer. Start it.
- Click the rain ambient sound. Let it play for 5 seconds.
- "Pomodoro with ambient audio. The Web Audio API gives us the sound."
- Pause the timer.

### 3:00 — Daily Planner
- Show 3 tasks with high/med/low priority.
- Check one off.

### 3:40 — Mood Tracker
- Click "Great" mood for today. Toast fires.
- Show 7-day mood graph.

### 4:20 — Water & Nutrition
- Click "+ 250ml" twice.
- Watch the glass fill animation.

### 5:00 — Sleep
- Show last 7 days of sleep durations as a chart.

### 5:40 — Insights & Badges
- Productivity score (0-100).
- 4 earned badges.
- 7-day consistency bars.

### 6:10 — Theme switch
- Toggle dark mode. Pause for the audience to react.
- "Full theming with CSS custom properties. Light, dark, glassmorphism. No CSS framework."

## 6:30 – 8:30 — The AI Coach (the wow moment)

Scroll to the AI Coach card on the Insights page.

> "Here's the part that's new. Every wellness app says 'consistency matters' — but they don't know my data. This does."

Click **Generate Insight**.

(Wait ~1-2 seconds for Claude to respond.)

Read the response out loud.

> "This was generated just now. It looked at my last 7 days — actually 14, in this demo — and wrote a specific 4-sentence message. It calls out a real number from my data, celebrates one thing, names one focus area, suggests one concrete action."

Click Generate again. Show a different response.

> "Saved to history. Last 5 are kept locally. If the backend is down, it falls back to a deterministic local insight — graceful degradation."

## 8:30 – 10:00 — Architecture + Git + AI workflow

Switch to a single architecture slide (or `ARCHITECTURE.md` open in VS Code).

> "Three pieces. Static frontend on Vercel. One serverless function that calls Anthropic's API. localStorage for all wellness data — nothing leaves my browser except the snapshot I explicitly send to the coach."

> "The frontend is vanilla JavaScript. No framework, no build step. Fifteen modules in one file, totally readable. The graders can just open `app.js` and read it top to bottom."

Switch to terminal.

```
git log --oneline
```

> "[N] commits across the project, with conventional commit messages."

Switch to VS Code with `api/coach.js` open.

> "The serverless function is 50 lines. It takes a JSON snapshot, calls Claude Haiku 4.5, returns the text. The API key lives in Vercel's environment, never in the browser."

Switch to `scripts/ralph-loop.js`.

> "I also used the Ralph Wiggum technique — a small autonomous loop. This script generates three coaching templates in different tones."

Run it live:
```
npm run ralph
```

Watch three "→ generating X template" lines appear.

> "No retries, no backoff. Pure repetition. The philosophy is that simple loops are more robust than orchestrated ones. Took about 30 seconds for all three templates."

Show `.claude/skills/wellness-coach.md` briefly.

> "And there's a project Skill that defines the coach's voice — the 4-sentence contract, the tone rules, the things it must never do. Three Claude Code features in one project: a Skill, a live API integration, and an autonomous loop."

## 10:00 – 11:30 — Lessons learned

Three honest takeaways:

> "First — I was about to throw away this app and rebuild it in Next.js because the docs in the repo said it was supposed to be Next.js. Then I actually looked at what was already built. The biggest engineering decision I made was recognizing existing work and adding to it, not starting over. That saved this project."

> "Second — the AI Coach was the smallest feature in terms of lines of code but had the biggest UX impact. About 150 lines total. The lesson is that the best features aren't the largest; they're the ones that use the data you've already collected in a new way."

> "Third — I learned to prompt Claude with constraints, not designs. 'Add an AI button' produced something wrong. 'Add a module after Insights that builds a snapshot from these specific localStorage keys, POSTs to this endpoint, falls back to a local insight on failure' produced exactly what I wanted in one shot."

## 11:30 – 12:00 — Q&A

Expected questions:

**Q: What did this cost to run?**
A: Claude Haiku 4.5 is around $0.005 per call. I made maybe 50 calls developing it. Less than $1 total.

**Q: Why no auth?**
A: It's a personal app. Adding accounts would have meant a database, which would have meant either Supabase or a backend. localStorage is more private and simpler. Multi-device sync is the obvious v2.

**Q: What's the failure mode if Claude returns garbage?**
A: I trust the response — no validation. If Claude returns nonsense, the user sees nonsense for that one call. The next click tries again. That's the Ralph spirit.

**Q: Could you swap out Claude for another model?**
A: Yes. The only Anthropic-specific code is in `api/coach.js` — about 15 lines. Swap the SDK and the model name, done.

**Q: What would you change?**
A: Two things. (1) Add a user-controllable system prompt — let the user pick the coach's tone. (2) Cache the last response per snapshot so repeated clicks don't re-hit the API.

---

## If something breaks

1. Stay calm. Say: "Looks like the live one's having a moment — let me show you the recording."
2. Open the backup video tab.
3. Play the relevant section.
4. After the video, resume the demo from the next section.

The graders care that you have a backup plan more than that nothing breaks. Acknowledging gracefully is itself a sign of polish.

---

## Data-seeding bookmarklet

Use this to pre-populate localStorage so the heatmap and Insights look populated in the demo. Paste into the browser console on the live site (or save as a bookmarklet):

```javascript
(() => {
  const days = Array.from({length: 14}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const habits = [
    { id: 'h1', name: 'Read 20 minutes', color: 'purple', icon: '📚', completedDates: days.filter((_,i) => i%3 !== 0) },
    { id: 'h2', name: 'Walk outside', color: 'green', icon: '🚶', completedDates: days.filter((_,i) => i%2 === 0) },
    { id: 'h3', name: 'No phone first hour', color: 'blue', icon: '📵', completedDates: days.slice(0, 7) }
  ];
  localStorage.setItem('zenith_habits', JSON.stringify(habits));
  const moods = { logs: {} };
  ['great','good','okay','good','great','good','okay'].forEach((m,i) => moods.logs[days[i]] = { mood: m });
  localStorage.setItem('zenith_moods', JSON.stringify(moods));
  const sleep = { logs: {} };
  [7.5, 8, 6, 7, 8.5, 7, 6.5].forEach((h,i) => sleep.logs[days[i]] = { duration: h, quality: 'good' });
  localStorage.setItem('zenith_sleep', JSON.stringify(sleep));
  const water = { goal: 2000, logs: {} };
  days.slice(0,7).forEach(d => water.logs[d] = [{amount: 250}, {amount: 250}, {amount: 500}]);
  localStorage.setItem('zenith_water', JSON.stringify(water));
  location.reload();
})();
```
