# Food Technology Judging Scoresheet

A live scoring and tallying webapp for a judged competition:

- **Admin tab** *(password-protected)* — set the criteria (name, description, weight %), and
  add/edit/remove participants and judges.
- **Judge tab** — each judge picks their own name, picks a participant, and sets a score
  (0–100) per criterion. The weighted total is calculated live as they move the sliders.
- **Results tab** *(password-protected)* — a live leaderboard with each judge's weighted score
  per participant and the overall average, ranked automatically. Click a row to see the
  per-criterion breakdown. Exportable as CSV.

The Admin and Results tabs are gated behind a shared password: **`admin123`**. Once entered,
a tab stays unlocked for that browser tab until it's closed (or you click "Lock this tab").
This is a simple client-side gate meant to keep casual viewers out — it is not secure against
someone reading the page source, so don't rely on it to protect sensitive data.

Scores refresh automatically every 6 seconds so everyone (admin, judges, and anyone watching
the results screen) sees the same live tally.

## How scoring is calculated

For each participant, each judge gives a raw score (0–100) per criterion. Those are combined
using the criterion weights into a weighted total out of 100:

```
weighted total = Σ (raw score × weight / 100)   for each criterion
```

A participant's final average is the mean of the weighted totals from every judge who has
scored them so far.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any extra setup this uses a local JSON file
(`.data/db.json`) as storage, which is fine for testing on your own machine but is **not**
shared between different devices.

## Deploying to Vercel (with shared, multi-device storage)

Judges will likely use their own phones or laptops, so the app needs one shared database
instead of the local-file fallback. The easiest option is Vercel's free KV store:

1. Push this project to a GitHub repository.
2. In Vercel, click **Add New → Project** and import that repository. Vercel auto-detects
   Next.js, so no build configuration is needed.
3. After the first deploy, open the project in the Vercel dashboard, go to the **Storage**
   tab, and add a **Redis** database from the Vercel Marketplace (Upstash Redis — the free
   tier is enough for this use case). Connect it to your project.
4. This automatically adds `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or, on
   older accounts, `KV_REST_API_URL` / `KV_REST_API_TOKEN`) as environment variables on
   your project. Redeploy — Vercel usually triggers this automatically after connecting
   storage, otherwise trigger a redeploy from the Deployments tab.
5. Once redeployed, the banner in the app that says "local storage (dev mode)" will change
   to "shared live database" — that confirms every judge is now writing to the same
   scoresheet no matter what device they use.

Share the deployed URL with your judges and admin. Everyone uses the same link; the tabs
(Judge / Results / Admin) are just views into the same shared data, so there's no login
system — treat the Admin tab as something you only share with organizers.

## Project structure

```
pages/
  index.js         main page: tabs + polling
  api/state.js      GET full state / PATCH criteria, participants, judges, event name
  api/scores.js     POST a judge's score for a participant / DELETE to clear one
components/
  AdminPanel.js
  JudgePanel.js
  ResultsPanel.js
  PasswordGate.js    password gate wrapping the Admin and Results tabs
lib/
  db.js             storage layer (Vercel KV in production, JSON file fallback locally)
  scoring.js         weighted-score and leaderboard calculations
styles/globals.css   visual design
```

## Customizing

- Edit the default criteria in `lib/db.js` (`DEFAULT_STATE.criteria`) — this only matters
  for a brand-new database; once the app is running, use the Admin tab instead.
- Nothing else needs to change to add more judges or participants — that's all done from
  the Admin tab at runtime.
