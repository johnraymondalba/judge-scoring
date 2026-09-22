# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Judges** are the primary users. They are faculty members and invited industry
guests, scoring on their own phones while standing at a judging table in an
auditorium, during a live pitch event. They are watching a presentation at the
same time as scoring. Most will use this product once, for about an hour, and
never again — so nothing may depend on prior familiarity, training, or
remembering how it worked last time.

**The organizer** is a single student running the event from a laptop. They set
up the event beforehand, issue each judge their sign-in PIN, watch scores
arrive live, and read out or export the final result. They are under time
pressure during the event and cannot stop to debug.

## Product Purpose

A live scoring and tallying scoresheet for judged competitions. Judges submit a
score per criterion per participant; the system applies the criterion weights,
averages across judges, and produces a ranked result the organizer can announce
and export. It exists to replace paper scoresheets and the manual arithmetic
that follows them, which is slow and error-prone at the exact moment — between
the last pitch and the announcement — when it must not be.

## Positioning

The product's claim is trustworthy arithmetic under live conditions, not
feature breadth. Three properties carry it, and each is already implemented:

- A score is attributable. Judge identity comes from a signed server session,
  not from a browser-supplied field, so no judge can submit under another's
  name.
- A score is never invented. An untouched criterion is stored as absent rather
  than as a midpoint, and an incomplete sheet cannot be submitted.
- A score is never silently lost. Submissions are atomic per judge-participant
  pair, so simultaneous submissions from several judges cannot overwrite each
  other, and in-progress drafts survive a locked phone or a refresh.

A general-purpose form builder or survey tool can collect the same numbers but
cannot make these three guarantees.

## Operating Context

Each participant gets a fixed slot — in the current format a 3-minute pitch
followed by a 7-minute Q&A. Judges score during or immediately after a slot,
with roughly the length of a changeover before the next team begins. Scoring
therefore happens in short, interrupted bursts, one-handed, while attention is
mostly on the stage.

Judges, the organizer and any display all share one deployed URL and pick a
role on arrival. The venue's network is not guaranteed to be good.

The event runs once through: the pitch cannot be replayed, and a lost or
mis-entered score cannot be recovered by re-watching anything.

## Capabilities and Constraints

- Two roles, separately authenticated: judges sign in with a name plus a 4–6
  digit PIN the organizer issues; the organizer signs in with a password held
  in `ADMIN_PASSWORD`. Sessions are signed httpOnly cookies lasting 12 hours.
- PINs are stored only as salted scrypt hashes and cannot be read back, only
  replaced or revoked.
- The organizer defines the event name, the weighted criteria, the
  participants, and the judges.
- The organizer controls which team is currently presenting. Unannounced
  teams are hidden from judges; once announced, a team stays pending for each
  judge until scored, then moves into that judge's private review archive.
- Weighted total per participant per judge; final placing is the mean of the
  judges who scored them. Results export as CSV.
- **The live leaderboard is organizer-only.** A signed-in judge sees only their
  own submitted scores and a signed-out visitor sees none, so standings cannot
  bias judging while it is in progress.
- Clients poll for shared state every 6 seconds.
- Storage is Upstash Redis in production, with a local JSON file fallback for
  development that does not sync between devices.

### Scale

The product must hold its shape from the smallest real event — 3 judges and 3
participants, which is the current data — up to roughly 10 judges and 30
participants. Above the small end this rules out designs that assume every
participant is visible at once or that every judge fits in a table column.

### Settled: the scoring input model

The stored model is a weighted total out of 100, from raw 0–100 scores per
criterion, and **it stays exactly as it is**. A banded-rubric alternative was
proposed and declined, so scores already recorded remain comparable and the CSV
contract is unchanged. Only the control a judge touches may be redesigned.

The concern that prompted the proposal is recorded so future work does not
rediscover it: no human reliably distinguishes 82 from 84 after a three-minute
pitch, yet averages are reported to two decimal places, so a placing can turn
on a digit no judge intended. With the continuous scale retained, the control
itself must carry the burden of not inventing precision.

## Brand Commitments

There is no institutional, school or departmental identity to carry, and no
logo is binding.

The user was first offered a set of distinctive visual worlds and deliberately
chose the category standard instead: convention, executed at full craft. That
choice shipped as an inset grouped-list "Settings app" grammar with no card
shadows and no glass. The user has since revisited it and pinned a different
Apple idiom directly, rather than through another roll: a card-and-glass
material system. **This replaces the prior craft-bar commitment as the
standing preference, not a one-off restyle.** Future work extends the
card-and-glass system rather than reopening the question again.

Two decisions are binding:

- **Craft bar: Apple's card-and-glass apps.** The design language is Apple's
  own card apps (Wallet, App Store, Health, Control Center): floating,
  continuous-corner cards holding data, with a genuine two-material
  hierarchy — translucent vibrancy confined to chrome (navigation, the bottom
  action bar, alerts, the PIN keypad sheet), solid opaque fills on every card
  that carries data. Depth comes from a restrained, two-layer shadow system
  scaled to three elevation tiers, never from a single heavy drop shadow, and
  never from glass applied to primary content. One tint still carries every
  interactive element. See DESIGN.md for the exact tokens.
- **Both themes, following the device.** A full light and dark theme with a
  manual override. The judge is in a dimmed auditorium and the organizer is on
  a laptop; neither may be forced into the other's lighting. Glass surfaces
  must not compromise this: chrome vibrancy adapts per theme the same way the
  solid grounds already do, and body text stays on solid cards precisely so
  the auditorium-dim judge keeps AA contrast regardless of what is happening
  in the blur behind the chrome.

## Evidence on Hand

- Real event data in `.data/db.json`: the event "StartUp Awareness", three
  judges, three participant teams, five weighted criteria totalling 100%, and
  nine submitted scores.
- The criteria carry real prose descriptions written for this competition.
- A prior design review is archived at `.impeccable/critique/`.
- There are **no** logo files, brand assets, photography, testimonials, past
  results or usage statistics in the project. Future work must not fabricate
  any of these.

## Product Principles

1. **The stage owns the judge's attention; the interface borrows it.** Every
   screen is designed for someone looking up from it every few seconds, not
   for someone reading it.
2. **A number that no judge meant must never reach the result.** Absent stays
   absent, precision never exceeds what a human can actually discriminate, and
   nothing is committed by accident.
3. **Nothing is lost.** Not to a locked phone, a refresh, a bad network, a
   simultaneous submission, or a mistap.
4. **Certainty is stated, not implied.** A provisional standing must look
   provisional; the organizer must never read a confident ranking that the
   submitted scores do not yet support.
5. **Used once, understood immediately.** No training, no prior visit, no
   instructions a judge has to be told out loud by a student.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Specific needs established for this product: one-handed
phone operation with 44px minimum touch targets; legibility in a dimmed
auditorium; full keyboard and screen-reader operation of both roles, since
judges are faculty of varied ages and abilities; and no meaning carried by
colour alone.
