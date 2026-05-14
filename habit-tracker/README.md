# Habit Tracker

A daily habit tracking web app with streak visualization, statistics, and AI-generated nightly summaries.

Built as the capstone project (Project 3) for the Web Application course.

## Live Demo

> Add Vercel URL here once deployed: `https://your-app.vercel.app`

## Features

- Magic-link authentication (no passwords)
- Create, edit, and delete daily habits
- One-click daily check-in
- Live streak counter for each habit
- GitHub-style heatmap calendar (last 365 days)
- Stats dashboard: current streak, longest streak, completion %
- **AI-generated nightly summary** — every night, a Claude-powered autonomous loop reviews your week and writes a personalized motivational message + tomorrow's suggested focus
- Mobile-responsive UI
- Dark mode

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | Full-stack React, simplest deploy to Vercel |
| UI | shadcn/ui + Tailwind CSS | Pre-built components, minimal React knowledge required |
| Database / Auth | Supabase (Postgres) | Built-in magic-link auth, generous free tier |
| Charts | Recharts + react-calendar-heatmap | Easiest charting libraries for React |
| Deploy | Vercel | One-click GitHub integration, free for personal use |
| Cron / Autonomy | Vercel Cron + Claude Code CLI | Runs Ralph Wiggum loop nightly |

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full diagram and decision log.

## AI Collaboration

This project was built with heavy use of Claude Code. See [AI_COLLABORATION.md](AI_COLLABORATION.md) for prompts, the Ralph Wiggum loop design, and lessons learned.

## Setup (Local Development)

> **New to React/Next.js?** Read [docs/SETUP.md](docs/SETUP.md) first — it has a step-by-step walkthrough.

### Prerequisites

- Node.js 20 or later
- A free Supabase account (https://supabase.com)
- A free Vercel account (https://vercel.com)

### Steps

1. Clone the repo and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd habit-tracker
   npm install
   ```

2. Create a Supabase project at https://supabase.com/dashboard. Then in the SQL editor, run the contents of `supabase/schema.sql`.

3. Copy `.env.example` to `.env.local` and fill in:
   ```bash
   cp .env.example .env.local
   ```
   You'll need:
   - `NEXT_PUBLIC_SUPABASE_URL` (from Supabase → Project Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same place)
   - `SUPABASE_SERVICE_ROLE_KEY` (same place, used only by Ralph loop)
   - `ANTHROPIC_API_KEY` (from console.anthropic.com)

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Running the Ralph Wiggum nightly loop locally

```bash
npm run ralph
```

This reads all users from Supabase, calls Claude for each, and writes summaries back to the `daily_summaries` table. In production it runs automatically every night at 11pm UTC via Vercel Cron.

## Deployment

See [docs/SETUP.md](docs/SETUP.md#deployment) for the Vercel deploy walkthrough.

## Project Status

This is an academic capstone project. Built solo over weeks 13–16 of the Web Application course.

## License

MIT
