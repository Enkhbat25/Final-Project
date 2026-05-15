# Zenith — Personal Wellness Dashboard

A comprehensive personal wellness web application combining habit tracking, focus sessions, mood logging, sleep monitoring, water intake, and AI-powered coaching — all in a single polished single-page app.

Built as the capstone project (Project 3) for the Web Application course.

> **Live demo:** **https://habit-tracker-xi-bice.vercel.app**

---

## Features

Eight interconnected wellness features plus an AI coaching layer:

| Feature | What it does |
|---|---|
| **Dashboard** | Daily snapshot — today's habits, water intake, focus minutes, sleep hours, current mood. |
| **Habits** | Create / edit / delete habits, one-click daily check-in, live streak counter, week-dot visualization. |
| **Focus Mode** | Configurable Pomodoro timer with ambient sound (rain), session history, weekly focus stats. |
| **Daily Planner** | Task list with priority levels (high / medium / low), completion tracking. |
| **Mood Tracker** | 5-level emoji mood log, daily entries, historical trend graph. |
| **Water & Nutrition** | Visual water-glass tracker with intake goal progress, nutrition notes. |
| **Sleep & Energy** | Log sleep duration, bedtime / wake time, quality rating, sleep history chart. |
| **Insights & Badges** | Productivity score (0–100), 7-day consistency analysis, achievement badge system with 10-level XP progression. |
| **AI Wellness Coach** | _NEW._ Sends a JSON snapshot of your week to Claude (Anthropic API) and returns a personalized 4-sentence coaching message. Last 5 insights saved locally. |

Plus full **light / dark mode**, **glassmorphism design**, **smooth transitions**, and **toast notifications**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla JavaScript (no framework) — ~4,000 lines, 15 modules |
| Styling | Hand-written CSS with custom properties; light + dark themes |
| Persistence | `localStorage` (prefixed `zenith_*`) with try/catch error handling and JSON export |
| AI Coach backend | Vercel serverless function ([api/coach.js](api/coach.js)) calling the Groq API |
| AI model | `llama-3.3-70b-versatile` (via Groq's LPU inference) — sub-1s typical responses |
| Hosting | Vercel — static frontend + one serverless function |

**Why vanilla JS?** Zero build step, instant page load, easy for graders to read, and no framework lock-in. The whole frontend is three files: [index.html](index.html), [app.js](app.js), and [sounds/rain.mp3](sounds/rain.mp3).

---

## Claude Code Integration

The project uses **three** Claude Code advanced features (the rubric only requires one):

### 1. Skill — `.claude/skills/wellness-coach.md`
A project-scoped Skill that defines the wellness coach's voice, output contract, and rules. Reused by:
- The live AI Coach API ([api/coach.js](api/coach.js)) as the system prompt foundation
- The Ralph Wiggum loop (below) to generate fallback templates
- Future contributors who want to extend the coach without re-deriving the tone

### 2. Live AI Coach — `api/coach.js`
A Vercel serverless function that proxies a wellness snapshot to Llama 3.3 70B via Groq's OpenAI-compatible API. The browser never sees the API key.

Flow:
```
Browser  →  POST /api/coach  →  Groq (Llama 3.3 70B)  →  4-sentence response
   ↑                                                              │
   └────── displayed in Insights tab + saved to history ←─────────┘
```

> **Note on the Claude Code requirement:** the rubric requires Claude *Code* features (Skills, MCP, Ralph Wiggum) — features of the development tool. The Skill below and the Ralph loop were built using Claude Code. The model that powers the deployed AI Coach is Llama 3.3 70B because it's free to call; the integration pattern would be identical for Claude.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full diagram.

### 3. Ralph Wiggum loop — `scripts/ralph-loop.js`
A small autonomous Node script that loops over three coaching styles (motivational / analytical / chill) and asks Claude to generate fallback insight templates. The "Ralph" technique is intentionally simple: no retries, no backoff, no orchestration — pure repetition. See https://ghuntley.com/ralph/ for the philosophy.

Run with:
```bash
GROQ_API_KEY=gsk_... npm run ralph
```
Output written to `coach-templates/{style}.json`.

---

## Local Development

### Prerequisites
- Node.js 20+
- A Groq API key — free, no credit card (https://console.groq.com)
- Vercel CLI: `npm i -g vercel`

### Run locally with live AI
```bash
npm install
cp .env.example .env
# Edit .env with your real GROQ_API_KEY
vercel dev
```
Opens at http://localhost:3000.

### Run as static-only (no AI backend)
```bash
npx serve .
```
The AI Coach button will gracefully fall back to a locally-computed offline insight.

---

## Deployment

```bash
vercel             # first-time link to GitHub repo
vercel env add GROQ_API_KEY production
vercel --prod
```

That's it. Vercel auto-detects the static frontend + `api/` serverless function and deploys both. Subsequent `git push` to `main` redeploys.

---

## Documentation

| File | What it covers |
|---|---|
| [README.md](README.md) | This file — overview, features, setup. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram, module map, localStorage schema, design decisions. |
| [AI_COLLABORATION.md](AI_COLLABORATION.md) | How Claude Code was used to build this project (both the original 8-feature dashboard and the AI Coach feature added in the final phase). |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | 10–12 min presentation script for the final demo. |
| [.claude/skills/wellness-coach.md](.claude/skills/wellness-coach.md) | The Wellness Coach Skill definition. |

---

## Privacy & Data

All wellness data lives in your browser's `localStorage`. Nothing leaves your device except the snapshot you explicitly send to the AI Coach (which is anonymous and not persisted on the server). The Vercel serverless function is stateless.
