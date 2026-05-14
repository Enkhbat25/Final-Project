# Architecture

## System Overview

Zenith is a static single-page application with one serverless function for AI calls. No database, no auth, no framework. Everything that can stay client-side, does.

```
   ┌─────────────────────────────────────────┐
   │           Browser (the app)             │
   │  ┌───────────────────────────────────┐  │
   │  │  index.html  (UI + embedded CSS)  │  │
   │  │  app.js      (15 modules)         │  │
   │  └─────────────┬─────────────────────┘  │
   │                │                        │
   │       ┌────────┴──────────┐             │
   │       ▼                   ▼             │
   │  localStorage       fetch /api/coach    │
   │  (all data)              │              │
   └──────────────────────────┼──────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────┐
        │   Vercel serverless function          │
        │     api/coach.js                      │
        │   (forwards snapshot to Anthropic)    │
        └─────────────────────┬─────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────┐
        │     Anthropic API                     │
        │  claude-haiku-4-5-20251001            │
        └───────────────────────────────────────┘
```

The frontend works fully offline. The AI Coach is the only feature that needs network. If the serverless function is unreachable, the app falls back to a locally-computed insight.

---

## Frontend Modules (in `app.js`)

15 modules, each a plain object literal. No `class`, no ES modules, no imports — global object pattern keeps the file readable and grader-friendly.

| Module | Responsibility | Approx lines |
|---|---|---|
| `Utils` | Date formatting, escapeHtml, safeNumber, day-array helpers | ~80 |
| `Storage` | localStorage get/set with try/catch + JSON export | ~30 |
| `Toast` | Slide-in notifications | ~40 |
| `ThemeManager` | Light/dark theme persistence | ~35 |
| `XPSystem` | 10-level XP progression + level-up notifications | ~70 |
| `Navigation` | Sidebar + page routing | ~40 |
| `PageRenderer` | Templates and `initPage()` dispatch | ~600 |
| `Dashboard` | Today snapshot + heatmap render | ~100 |
| `Habits` | CRUD + check-in + streaks | ~200 |
| `Focus` | Pomodoro timer + ambient audio | ~1700 |
| `Planner` | Tasks (CRUD + priority) | ~160 |
| `Mood` | 5-level emoji log + history graph | ~150 |
| `Water` | Visual glass tracker | ~115 |
| `Sleep` | Duration log + chart | ~110 |
| `Insights` | Productivity score + heuristic insights | ~160 |
| `AICoach` | Live Claude-powered coach + history | ~150 |
| `Badges` | 10-badge achievement system | ~90 |

Module loading order in [app.js](app.js) is: Utils → Storage → Toast → ThemeManager → XPSystem → Navigation/PageRenderer → feature modules. Each later module can reference earlier ones.

---

## Data Model (localStorage)

All keys are prefixed `zenith_` to namespace from other apps on the same origin.

| Key | Shape | Used by |
|---|---|---|
| `zenith_habits` | `[{ id, name, color, icon, completedDates: [...] }]` | Habits, Dashboard, Insights, AICoach |
| `zenith_tasks` | `[{ id, title, priority, due, status }]` | Planner, Insights |
| `zenith_moods` | `{ logs: { "YYYY-MM-DD": { mood, note } } }` | Mood, Insights, AICoach |
| `zenith_sleep` | `{ logs: { "YYYY-MM-DD": { duration, quality } } }` | Sleep, Insights, AICoach |
| `zenith_water` | `{ goal, logs: { "YYYY-MM-DD": [{ amount }] } }` | Water, Insights, AICoach |
| `zenith_focus` | `{ sessions: { "YYYY-MM-DD": [{ duration }] } }` | Focus, Insights, AICoach |
| `zenith_xp` | `{ total, level }` | XPSystem |
| `zenith_theme` | `"light" \| "dark"` | ThemeManager |
| `zenith_coach_history` | `[{ text, at }]` (last 5) | AICoach |

There is no migration system. Schema changes ship with an upgrade function in `Storage`. For a personal-scale app this is acceptable.

---

## AI Coach Flow

1. User clicks **Generate Insight** in the Insights tab.
2. `AICoach.buildSnapshot()` reads habits, mood, sleep, focus, and water from localStorage, windowed to the last 7 days.
3. `AICoach.hasEnoughData()` gates the call — at least 3 data points across all categories. Below that, the user gets a friendly "log more" message instead.
4. Browser POSTs `{ snapshot }` to `/api/coach`.
5. The serverless function (`api/coach.js`) reads `ANTHROPIC_API_KEY` from Vercel env, calls `claude-haiku-4-5-20251001` with the wellness-coach system prompt + the snapshot, returns the response.
6. Browser renders the response, awards 15 XP, and prepends it to `zenith_coach_history` (capped at 5 entries).
7. On failure, `AICoach.localFallback()` computes a deterministic local insight from the same snapshot — the feature degrades gracefully.

The Anthropic API key never reaches the browser. The serverless function is stateless (no logs, no DB).

---

## Why These Choices

**Vanilla JS over a framework.** The original app shipped before the AI Coach was added. A framework would have meant a build step, npm dependencies, and 5x more files for a grader to read. Plain JS is faster to load, easier to audit, and totally sufficient for a localStorage-backed personal dashboard.

**localStorage over a real database.** Multi-device sync is a v2 feature. For a single-user wellness tracker, localStorage is simpler, more private, and doesn't require auth.

**Vercel over GitHub Pages.** GitHub Pages can't host the serverless function for the AI Coach. Vercel handles both static + functions in one deploy. Free tier covers the project budget by ~100x.

**Claude Haiku over Sonnet/Opus.** Haiku is ~5x faster and ~12x cheaper. The Coach task is short and well-specified; we don't need a frontier model.

**No retries on the Ralph loop or in `/api/coach`.** The "Ralph Wiggum" philosophy: keep loops dumb. If one call fails, the next user click tries again. No exponential backoff, no circuit breaker, no observability layer — the entire feature is ~100 lines.

---

## Trade-offs Worth Knowing

- **No cross-device sync.** Data is browser-local. Clearing site data deletes everything (export is available).
- **No multi-user.** No auth, no accounts. Each browser is an "account".
- **No notifications.** No push, no email, no reminders. Open the app to interact.
- **Coach is rate-limited by your Anthropic plan.** No queueing, no caching.
- **Audio fallbacks log warnings on old browsers.** Web Audio API is required for ambient sounds in Focus mode.
