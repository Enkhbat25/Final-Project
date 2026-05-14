# Week-by-Week Plan

A concrete day-by-day checklist for weeks 13–16. Tick boxes as you go. If you fall behind, cut from Week 14 — never from Week 15 (polish) or Week 16 (demo).

---

## Week 13 — Foundation

### Days 1–3: Learn the basics
- [ ] Day 1: Complete sections 1–4 of https://nextjs.org/learn (Pages, Layouts, Routing, Server vs Client Components)
- [ ] Day 2: Complete sections 5–8 (Data Fetching, Mutations, Loading UI)
- [ ] Day 3: Complete sections 9–16 (Auth, Deployment)

Do NOT skip this. Three days now saves a week of confusion later.

### Day 4: Deploy nothing
- [ ] `npx create-next-app` per `docs/SETUP.md`
- [ ] `git init`, push to GitHub
- [ ] Connect to Vercel
- [ ] Live URL works (just shows the starter page)
- [ ] First commit message: `chore: bootstrap Next.js project`

### Day 5: Supabase
- [ ] Create Supabase project
- [ ] Run `supabase/schema.sql`
- [ ] Add env vars to `.env.local` AND to Vercel
- [ ] Create `lib/supabase/client.ts` (browser client)
- [ ] Create `lib/supabase/server.ts` (server-side client with cookies)

### Day 6: Auth
- [ ] `/login` page with email input + "Send magic link" button
- [ ] `/auth/callback` route handler
- [ ] Middleware that redirects unauthenticated users to `/login`
- [ ] Manual test: enter your email → check inbox → click link → land on `/dashboard`

### Day 7: Habits CRUD
- [ ] `/dashboard/habits` page listing habits (empty state for new users)
- [ ] "Add habit" dialog (shadcn `<Dialog>`)
- [ ] Server Action `createHabit`
- [ ] Edit and delete actions

**End of week 13 deliverable:** logged in user can create/edit/delete habits on a live URL.

---

## Week 14 — Features

### Day 8: Daily check-in
- [ ] `/dashboard` page lists today's habits with a big "Done" button each
- [ ] Server Action `toggleCompletion(habitId, date)` — handles both check and uncheck
- [ ] Optimistic UI update with `useOptimistic`

### Day 9: Streaks
- [ ] Use the `habit_streaks` view from the schema
- [ ] Display current streak next to each habit
- [ ] Display longest streak in stats card

### Day 10: Heatmap
- [ ] Install `react-calendar-heatmap`
- [ ] `<Heatmap />` client component that fetches last 365 days of completions
- [ ] Style with Tailwind: empty=gray-100, completed=green-500 (darken by count if multiple habits)
- [ ] Add to dashboard

### Day 11: Stats page
- [ ] `/dashboard/stats` route
- [ ] Three big numbers: total completions, longest streak, this-week %
- [ ] Recharts bar chart: completions per day for last 14 days
- [ ] Recharts pie chart: completions by habit (last 30 days)

### Day 12: Empty + error states
- [ ] Empty state for `/dashboard/habits` (illustrated, with "Add your first habit" CTA)
- [ ] Empty state for the heatmap (when 0 completions exist)
- [ ] 404 page
- [ ] Generic error boundary
- [ ] Loading skeletons on every async page

### Days 13–14: Buffer + bug bash
- [ ] Fix anything that's broken
- [ ] Pad your commits — the graders read these. Aim for descriptive messages.
- [ ] Tag a release: `git tag v0.1.0 && git push --tags`

**End of week 14 deliverable:** full feature set working, no Ralph yet.

---

## Week 15 — Advanced + Polish

### Day 15: Ralph Wiggum loop — local first
- [ ] Wire up `scripts/ralph-loop.ts` (already scaffolded for you)
- [ ] Run `npm run ralph` against your dev DB
- [ ] Manually check `daily_summaries` in Supabase — verify summaries look good
- [ ] Tweak the prompt in `buildPrompt()` until the output feels natural

### Day 16: Ralph Wiggum loop — production
- [ ] Create `app/api/cron/nightly-summaries/route.ts` that calls `runRalphLoop()`
- [ ] Protect with `CRON_SECRET` header
- [ ] Create `vercel.json` with the cron schedule
- [ ] Deploy
- [ ] Manually trigger via curl to verify it works
- [ ] Display tomorrow's summary in a card on the dashboard

### Day 17: habit-coach skill
- [ ] Skill file lives at `.claude/skills/habit-coach.md` (already scaffolded)
- [ ] Add a "Suggest habits" button to the empty state on `/dashboard/habits`
- [ ] When clicked, call the Anthropic API with the skill template
- [ ] Render the 5 suggestions; each has an "Add this" button

### Day 18: Visual polish
- [ ] Dark mode toggle (shadcn theme provider)
- [ ] Page transitions
- [ ] One delight moment: confetti when you hit a 7-day streak (use `canvas-confetti`)
- [ ] Logo + favicon (use https://favicon.io or have Claude generate SVG)
- [ ] Make sure mobile layout works — test in DevTools mobile view

### Day 19: Documentation
- [ ] Finish `AI_COLLABORATION.md` — at least 5 example prompts
- [ ] Update `README.md` with real screenshots
- [ ] Add an architecture diagram to `ARCHITECTURE.md` (use https://excalidraw.com → export PNG)

### Day 20: Bug bash with classmates
- [ ] Ask 3 classmates to use the app for 10 minutes each
- [ ] Watch over their shoulder (in person or screen share)
- [ ] Note every confusion, error, or "why does it do that?"
- [ ] Fix the top 3 issues. Defer the rest to v2.

### Day 21: Buffer
- [ ] Catch up. No new features after today.

**End of week 15 deliverable:** all features done, Ralph running nightly, app polished.

---

## Week 16 — Demo Week

### Day 22: Final pass
- [ ] Run the demo end-to-end yourself, timing it
- [ ] `git log --oneline | wc -l` — should be 30+ commits
- [ ] Read your own `AI_COLLABORATION.md` — make sure it's coherent

### Day 23: Record backup video
- [ ] Record a 5-minute screencast of the happy-path demo
- [ ] Upload to YouTube unlisted, or save locally
- [ ] This is your safety net if live demo fails

### Day 24: Practice
- [ ] Practice the demo out loud, twice
- [ ] Time it. Cut content if over 12 minutes.

### Day 25: Demo day
- [ ] Open the live URL in a clean browser window before class
- [ ] Have backup video ready in another tab
- [ ] Have `git log` open in a terminal tab
- [ ] Have `AI_COLLABORATION.md` open in another tab
- [ ] Breathe. You've shipped a real app.

### Day 26+: Submit
- [ ] Submit GitHub URL
- [ ] Submit live URL
- [ ] Submit any required write-up
