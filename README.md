# Food Technology Judging Scoresheet

A live scoring and tallying webapp for a judged competition.

Opening the app asks who you are — **Judge** or **Organizer** — and each role signs in
before it can do anything.

- **Judge** — picks their name, then enters the 4–6 digit PIN the organizer issued them on an
  on-screen keypad (no device keyboard involved). The team currently presenting is called
  out on their dashboard; earlier teams remain pending only until that judge submits. They
  score each criterion with a slider (or the +/- stepper), and submitted teams move into a
  private review archive where the judge can replace their own score.
- **Organizer** — signs in with the organizer password. Sets the event name, the criteria
  (name, description, weight %), the participants, and the judges and their PINs. They also
  set or revoke the team currently presenting and see the live leaderboard: each judge's
  weighted score per participant and the overall average, ranked automatically, exportable
  as CSV.

Scores refresh automatically every 6 seconds, so everyone sees the same live tally.

## Accounts and access

Judges' PINs are stored only as salted scrypt hashes. A PIN cannot be read back out of the
database or the Admin tab — it can only be replaced — so write each PIN down when you create
it and hand it to that judge privately.

Signing in sets an httpOnly, signed session cookie that lasts 12 hours. The score API takes
the judge's identity from that cookie rather than from the browser's request, so one judge
cannot submit or overwrite scores under another judge's name.

**The live leaderboard is organizer-only.** A signed-in judge can see only their own
submitted scores, and a signed-out visitor sees none at all — judges cannot check the
standings while judging is still in progress.

### Environment variables

| Variable | Purpose | Development fallback |
| --- | --- | --- |
| `ADMIN_PASSWORD` | The organizer sign-in password | `admin123` |
| `SESSION_SECRET` | HMAC key that signs the session cookie | a fixed dev string |

Both have insecure fallbacks so `npm run dev` works with no setup. **Set both for real
events** — the app shows organizers a warning banner while the fallbacks are in use. Anyone
who knows the default session secret can forge a session cookie for any role.

## How scoring is calculated

For each participant, each judge gives a raw score (0–100) per criterion. Those are combined
using the criterion weights into a weighted total out of 100:

```
weighted total = Σ (raw score × weight / 100)   for each criterion
```

A participant's final average is the mean of the weighted totals from every judge who has
scored them so far.

Every criterion must be given an explicit score before a judge can submit. Sliders start
blank rather than at a midpoint, so an untouched criterion can never be mistaken for a
deliberate score.

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
   your project. Vercel's own **Redis** store works too: it sets a single `REDIS_URL`,
   which the app also accepts.
5. In **Settings → Environment Variables**, also add your own `ADMIN_PASSWORD` and a long
   random `SESSION_SECRET`.
6. Redeploy. The banner that says "local storage (dev mode)" disappears once every judge is
   writing to the same scoresheet, and the default-credentials warning disappears once both
   variables above are set.

Share the deployed URL with everyone — judges and organizers use the same link and pick
their role on the first screen.

## Concurrency

Scores live in their own Redis hash, one field per judge-and-participant pair, so submitting
a score is a single atomic write. Two judges tapping Submit at the same instant can no longer
overwrite each other. The local-file fallback gets the same guarantee from an in-process
write queue.

## Project structure

```
pages/
  index.js           role chooser, sign-in routing, polling
  api/state.js       GET config (+ scores the caller is allowed to see) / PATCH setup (organizer only)
  api/scores.js      POST a score for a participant / DELETE to clear one
  api/auth/login.js  judge PIN and organizer password sign-in
  api/auth/logout.js clears the session cookie
  api/auth/session.js reports who is currently signed in
components/
  RoleChooser.js     the "Judge or Organizer" landing screen
  LoginForm.js       organizer password form and the judge's name + PIN-keypad sign-in
  ConfirmDialog.js   confirmation alert for sign-out and any destructive setup change
  AdminPanel.js      event setup, including judge PIN management
  JudgePanel.js
  ResultsPanel.js
  Icon.js            the single authored SVG icon set used everywhere in the UI
lib/
  db.js              storage layer (Redis in production, JSON file fallback locally)
  auth.js            PIN hashing, session cookie signing and verification
  scoring.js         weighted-score and leaderboard calculations
styles/globals.css   visual design — see DESIGN.md for the full system
```

## Customizing

- Edit the default criteria in `lib/db.js` (`DEFAULT_CONFIG.criteria`) — this only matters
  for a brand-new database; once the app is running, use the Admin tab instead.
- Adding judges, participants and PINs is all done from the Admin tab at runtime.
