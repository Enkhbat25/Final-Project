# Architecture

## System Overview

```
+--------------------+          +------------------+
|   Browser (React)  | <------> |   Next.js App    |
|   - shadcn/ui      |  HTTPS   |   (Vercel Edge)  |
|   - Tailwind       |          |                  |
+--------------------+          +--------+---------+
                                         |
                                         | Supabase JS SDK
                                         v
                                +------------------+
                                |    Supabase      |
                                |  - Auth (magic)  |
                                |  - Postgres DB   |
                                |  - Row-Level Sec |
                                +------------------+
                                         ^
                                         |
                                         | service role key
                                         |
+-------------------------+      +---------------------+
| Vercel Cron (nightly)   | ---> |  Ralph Wiggum loop  |
|  11pm UTC                |      |  scripts/ralph.ts   |
+-------------------------+      |  - Read 7d data     |
                                  |  - Call Claude API |
                                  |  - Write summaries |
                                  +---------------------+
                                            |
                                            v
                                    Anthropic Claude API
```

## Data Model

Three tables:

### `habits`
| Column      | Type       | Notes                                |
|-------------|------------|--------------------------------------|
| id          | uuid       | primary key                          |
| user_id     | uuid       | FK -> auth.users                     |
| name        | text       | e.g. "Read 20 minutes"               |
| description | text       | optional                             |
| color       | text       | hex code for UI, default #6366f1     |
| created_at  | timestamptz| default now()                        |
| archived_at | timestamptz| nullable; archived habits hide in UI |

### `completions`
| Column     | Type        | Notes                       |
|------------|-------------|-----------------------------|
| id         | uuid        | primary key                 |
| habit_id   | uuid        | FK -> habits                |
| user_id    | uuid        | FK -> auth.users (denorm)   |
| date       | date        | the day completed (no time) |
| created_at | timestamptz | default now()               |

Unique constraint on `(habit_id, date)` prevents double-counting.

### `daily_summaries`
| Column     | Type        | Notes                               |
|------------|-------------|-------------------------------------|
| id         | uuid        | primary key                         |
| user_id    | uuid        | FK -> auth.users                    |
| for_date   | date        | the date the summary is FOR (tomorrow) |
| body       | text        | the Claude-generated summary        |
| created_at | timestamptz | default now()                       |

Unique constraint on `(user_id, for_date)`.

## Row-Level Security

All three tables have RLS enabled. Policies:

- `SELECT`: users can read only their own rows
- `INSERT/UPDATE/DELETE`: same — `user_id = auth.uid()`
- `daily_summaries.INSERT`: allowed only with service role (the Ralph loop)

## Routing

Next.js App Router:

```
app/
  layout.tsx              # root layout with theme + Supabase client provider
  page.tsx                # marketing landing (logged out)
  login/
    page.tsx              # magic-link form
  auth/
    callback/route.ts     # handles Supabase magic-link callback
  dashboard/
    page.tsx              # main app: today's habits + heatmap
    stats/page.tsx        # stats dashboard
    habits/
      page.tsx            # habit list + add form
      [id]/page.tsx       # edit habit
```

Server Components fetch data directly via Supabase server client. Server Actions handle mutations.

## Why These Choices

**Next.js over plain React** — App Router gives us Server Components, which means the database query for "today's habits" happens server-side. The browser never sees the Supabase anon key in a fetch. Less JavaScript shipped, faster initial load.

**Supabase over a custom backend** — magic-link auth is one function call. Postgres is real SQL (better than Firebase's NoSQL for this domain). Free tier is generous. RLS lets us skip writing authorization code.

**shadcn/ui over MUI/Chakra** — shadcn components are copied into your repo, not imported from a package. You own the code. For a solo developer new to React, this means: when something breaks, you can read the source.

**Vercel Cron over a separate job runner** — one fewer service to manage. The cron job is just an HTTP endpoint Vercel hits on a schedule.

## Ralph Wiggum Loop Design

The "Ralph Wiggum" technique is named after the Simpsons character — a tight, simple, slightly-stupid autonomous loop that runs continuously. In this app:

1. Vercel Cron triggers `/api/cron/nightly-summaries` at 11pm UTC
2. The handler authenticates against Supabase with the service role key
3. For each active user with completions in the last 7 days:
   - Fetch their habits + completions from the last week
   - Build a prompt: "Here's their week. Write a 3-sentence encouraging summary and one focus for tomorrow."
   - Call the Anthropic API (claude-haiku-4-5 for speed/cost)
   - UPSERT the result into `daily_summaries` keyed by `(user_id, tomorrow)`
4. The dashboard reads from `daily_summaries` and shows tomorrow's summary in a card

The loop is intentionally simple: no retry logic, no exponential backoff, no streaming. If a single user fails, log it and continue. The next night's run will try again.

## Trade-offs Worth Knowing

- **No mobile app.** Web-only. Could be a PWA in v2.
- **No notifications.** Summaries appear when the user opens the app. Email notifications are a v2 feature.
- **One user per account.** No teams, no sharing. Scope decision to fit timeline.
- **No timezone awareness on the cron.** Everyone gets their summary at 11pm UTC. For a future version, store user timezone and trigger per-user.
