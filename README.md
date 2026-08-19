# HoopFinder

Is there a run going on right now? HoopFinder answers that for a small set of
hand-verified San Antonio courts, and nothing else.

QR stickers at each court link straight to `/c/<slug>`, so the court page — not
the home page — is the primary entry point. It leads with real recent check-ins
so a first-time visitor understands the app before it asks them for anything.

## Stack

Vite + React + TypeScript, React Router, Supabase (Postgres + REST), one plain
CSS file. No auth: each browser gets a UUID in `localStorage`.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev
```

### Database

In the Supabase SQL editor (or `supabase db push` if you use the CLI), run in
order:

1. `supabase/migrations/20260817000000_init.sql` — tables, enums, RLS
2. `supabase/seed.sql` — three placeholder courts

**Edit `seed.sql` before launch.** Every field in it is meant to be verified by
someone who has actually stood on the court. The `id` column is the slug that
ends up on the QR sticker (`/c/woodlawn`).

### Types

`src/types/database.ts` is generated from the schema and should never be edited
by hand. After any migration:

```bash
SUPABASE_PROJECT_ID=<your-project-ref> npm run db:types
```

> The committed copy was written to match the generator's output for the
> migration above, since this machine had no Supabase CLI to run it through.
> Run the command once against your project to confirm it round-trips.

App-facing aliases (`Court`, `Checkin`, `RunType`, …) live in
`src/types/models.ts` so regenerating never clobbers them.

## Core logic

`deriveCourtState(checkins, now)` in [src/lib/courtState.ts](src/lib/courtState.ts)
is the only place court state is decided. It is pure — `now` is injected — and
returns a discriminated union:

| status  | meaning                                  |
| ------- | ---------------------------------------- |
| `live`  | a check-in in the last 90 min            |
| `quiet` | most recent check-in is 90 min – 24 h old |
| `cold`  | most recent check-in is over 24 h old    |
| `none`  | never checked into                       |

`headcount` and `runType` exist only on the `live` branch, so a stale headcount
cannot be rendered by accident.

The UI re-derives on a 30-second tick, so a page left open on a bench stops
claiming a run is live once the window closes.

## Tests

```bash
npm test          # vitest — deriveCourtState, including both boundaries
npm run test:e2e  # playwright
npm run typecheck
```

Playwright covers the check-in happy path, submit staying disabled until both
questions are answered, the zero-check-in empty state, and a live run ageing out
after 90 minutes with a mocked clock.

The e2e tests never touch a real Supabase. `tests/support/supabaseStub.ts`
intercepts the REST calls and serves typed fixtures. Two things there are load-
bearing:

- The tests run on **port 5174**, not 5173, so they can never latch onto a dev
  server you already have running (that server would not be in `test` mode).
- `VITE_SUPABASE_URL` in `.env.test` is **same-origin** with the test server,
  because `page.route` does not intercept CORS preflights.

First run needs `npx playwright install chromium`.

## Deliberately not built

No map. No accounts. No follows, feeds, or streaks. No computed peak times or
averages — the court page shows the raw check-in log. No admin UI; courts are
seeded via SQL.

One note: the `court_ratings` table, its RLS policies, and its generated types
are all in place, but nothing in the UI reads or writes it yet — no rating
surface was specified for either route. Wiring it up is a small change when you
want it.
