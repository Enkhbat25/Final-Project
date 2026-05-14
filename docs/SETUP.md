# Setup Walkthrough (for someone new to React/Next.js)

This is the step-by-step version. If you've shipped a Next.js app before, just read the [README](../README.md).

---

## Part 1 — Install the basics (30 min)

### 1.1 Install Node.js

- Download the **LTS** version from https://nodejs.org (currently Node 22)
- Verify in PowerShell:
  ```powershell
  node --version
  npm --version
  ```
  Both should print version numbers.

### 1.2 Install Git (if you don't have it)

- https://git-scm.com/download/win
- Verify: `git --version`

### 1.3 Get a code editor

VS Code: https://code.visualstudio.com. Install these extensions:
- ESLint
- Tailwind CSS IntelliSense
- Prettier

---

## Part 2 — Create the Next.js project (15 min)

Inside your project folder (the one with this `README.md`), run:

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted:
- "Would you like to use Turbopack?" → **No** (Yes works too, but No is more stable)

This will create the standard Next.js folder structure on top of your existing scaffolding files. When asked about overwriting existing files (like `README.md`), answer **No** — keep yours.

Then install the extra dependencies listed in `package.json`:

```powershell
npm install @anthropic-ai/sdk @supabase/ssr @supabase/supabase-js react-calendar-heatmap recharts
npm install -D @types/react-calendar-heatmap tsx
```

Add shadcn/ui:

```powershell
npx shadcn@latest init
```

When prompted, accept all defaults. Then add the components you'll need:

```powershell
npx shadcn@latest add button card dialog input label tabs toast skeleton
```

---

## Part 3 — Set up Supabase (20 min)

### 3.1 Create a project

1. Go to https://supabase.com/dashboard
2. Sign up with GitHub
3. Click **New project**
4. Name: `habit-tracker`
5. Database password: generate one, save it in your password manager
6. Region: pick one near you (Singapore is closest to Mongolia)
7. Wait ~2 minutes for it to provision

### 3.2 Run the schema

1. Open **SQL Editor** in the Supabase sidebar
2. Click **New query**
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run** (bottom right)
5. You should see "Success. No rows returned."

### 3.3 Enable magic-link email

1. Go to **Authentication → Providers** in the sidebar
2. **Email** is on by default — that's all you need
3. Go to **Authentication → URL Configuration**
4. Set **Site URL** to `http://localhost:3000` (you'll change to your real URL later)

### 3.4 Copy your keys

1. Go to **Project Settings → API**
2. Copy these three values:
   - **Project URL** → goes in `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → goes in `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3.5 Create your .env.local

In the project root:

```powershell
copy .env.example .env.local
```

Open `.env.local` in VS Code and paste the values from step 3.4.

---

## Part 4 — Get an Anthropic API key (5 min)

1. https://console.anthropic.com
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy it into `.env.local` as `ANTHROPIC_API_KEY`

> The free tier should cover this whole project. The Ralph loop using Claude Haiku 4.5 costs roughly $0.005 per user per night.

---

## Part 5 — Run the dev server (2 min)

```powershell
npm run dev
```

Open http://localhost:3000. You should see the Next.js starter page. From here, you build out the app.

---

## Part 6 — First-day checklist

Before writing any feature code, do this on **day one**:

1. [ ] `git init` and push to a fresh GitHub repo
2. [ ] Connect the repo to Vercel (https://vercel.com → Import Git Repository)
3. [ ] Add the same env vars in Vercel (Settings → Environment Variables)
4. [ ] Deploy — even though it's just the starter page
5. [ ] Verify the live URL works
6. [ ] Create your first GitHub issue: "Implement magic-link login"
7. [ ] Open `claude` in the project root and ask it to start on that issue

Getting deployment working before writing features is the single highest-leverage thing you can do this week. The instructor's tip #1 says "Start with deployment" — they mean it.

---

## Part 7 — Where to go next

Open [WEEK_PLAN.md](WEEK_PLAN.md) for the day-by-day checklist.

When you run into something you don't understand, your first move should be to ask Claude Code:

```
claude "I just installed shadcn/ui and ran `npx shadcn add button`. Explain
what files this created and how I import the Button component into a page."
```

Don't be embarrassed to ask Claude for explanations. That's pair-programming, and it's what the AI Collaboration grading section is rewarding.

---

## Deployment (Week 13, day 1)

Even before features exist:

1. Push your repo to GitHub
2. https://vercel.com/new → import your repo
3. In **Environment Variables**, paste in everything from `.env.local`
4. Click **Deploy**
5. Wait ~90 seconds
6. Visit the assigned `*.vercel.app` URL

Every `git push` to `main` automatically redeploys. That's the workflow.

### Setting up the Vercel Cron (Week 15)

When you're ready to enable the Ralph loop in production:

1. Create `app/api/cron/nightly-summaries/route.ts` that calls `runRalphLoop()` from `scripts/ralph-loop.ts`
2. Create `vercel.json`:
   ```json
   {
     "crons": [
       { "path": "/api/cron/nightly-summaries", "schedule": "0 23 * * *" }
     ]
   }
   ```
3. Push to main. Vercel will start invoking the endpoint at 23:00 UTC daily.
4. Watch logs: Vercel dashboard → your project → **Logs**
