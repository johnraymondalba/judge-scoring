---
version: 1
slug: "pages-index-js"
primary_target: "pages/index.js"
related_targets: ["components/JudgePanel.js","components/AdminPanel.js","components/ResultsPanel.js","components/RoleChooser.js","components/LoginForm.js","styles/globals.css"]
---

# Judging scoresheet — all surfaces

Scope: the whole product (role chooser, both sign-ins, judge scoring, organizer
setup, results). Visitor mode: **Operate**.

Audience: faculty and industry judges on their own phones, standing in a dimmed
auditorium, attention mostly on a stage, using this once for an hour. One
student organizer on a laptop under time pressure. Must hold from 3 judges and
3 participants up to roughly 10 and 30.

Constraint: the 0–100 weighted scoring model is fixed. Only the control changes.

## Direction contract

**THESIS.** The scoresheet becomes Apple's card-and-glass material system —
floating rounded surfaces with a genuine two-tier hierarchy, frosted chrome
above solid content — replacing the grouped-list Settings grammar it shipped
with. It refuses flat washes and hairline-only depth in favor of the layering
Apple's own card apps (Wallet, App Store, Health, Control Center) use, where
navigation and overlays float in vibrancy and the data itself sits on plain,
fully opaque cards beneath.

**OWN-WORLD.** Two material tiers, never mixed. **Chrome** — the nav bar, the
bottom action bar, alerts, and the PIN keypad sheet — is translucent:
`backdrop-filter: blur(20–30px) saturate(180%)` over a ~75–85%-opacity surface
tint, a 1px hairline border at low alpha, no drop shadow (blur itself reads as
the separation). **Content** — every card holding data: criterion cards,
participant cards, standing cards, setup fields — is solid and opaque, never
blurred. Corner radius scales with the card's role: 20px for a page-level
card, 14px for a card nested inside one, 10px for a control. Three shadow
tiers, each an ambient layer (soft, no offset) plus a key layer (small offset,
tighter blur), so elevation reads as two honest light sources rather than one
heavy blob: **resting** (`0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.08)`)
for cards sitting in the list; **raised** (`0 2px 4px rgba(0,0,0,.06), 0 4px
16px rgba(0,0,0,.12)`) for an open/expanded card or a focused field; **floating**
(`0 4px 8px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.18)`) for the PIN sheet and
alerts, the only elements allowed to sit above the chrome layer itself. One
tint still carries every interactive element and nothing decorative;
shadows never substitute for it as an affordance cue.

**STORY.** The judge opens the link, sees the same two roles as floating cards
on a softly tinted ground, and picks one. Signing in as a judge means tapping a
name field, then a PIN sheet slides up in glass with a full custom numeric
keypad — no system keyboard ever appears — dot indicators filling as digits
land, auto-submitting on the last one. Scoring presents participants and
criteria as solid cards under a glass nav bar that stays legible as the page
scrolls beneath it. They believe the number they submitted is the number
recorded. The organizer gets the same two-tier material at laptop density,
glass confined to its own chrome, dense setup forms staying solid so nothing
frosted sits behind a wall of fields.

**FIRST VIEWPORT** (judge, scoring). A glass nav bar names the participant and
running-order position, blurring the content as it passes beneath. Below it,
one solid, continuous-corner card per criterion — name leading, weight as a
small pill, score trailing in large tinted numerals; an unscored card carries
a hairline border and an em-dash, no tint, so a half-finished sheet is legible
at a glance. A second card beneath, at the raised shadow tier, shows the
weighted total. The primary action lives in a glass action bar floating clear
of the bottom edge, holding the full-width filled button and the "2 of 3
scored" caption. **Signature interaction (carried over, restyled):** tapping a
criterion card still unfolds its control in place rather than navigating away;
now its shadow lifts from resting to raised as it opens, so the expansion
reads as the card coming forward, not just growing taller. **PIN keypad**
(login): a glass sheet rises from the bottom holding six dot indicators and a
4x3 grid of large glass digit buttons plus delete; correct-length entry
auto-submits, wrong PIN shakes the dots once and clears. **Motion grammar:**
height, opacity, and shadow-tier together, 220ms ease-out, fully suppressed
under `prefers-reduced-motion`.

**FORM.** Apple's card-and-glass system (Wallet / App Store / Health / Control
Center), pinned directly by the user rather than drawn from the roll — a
deliberate reversal of the previously recorded standing preference
(grouped-list, no shadows), now itself recorded as the new standing direction
in PRODUCT.md. Executed at the craft level of Apple's own first-party card
apps: a real two-material system with restrained, purposeful accent use, never
the web category's glassmorphism pastiche of rainbow blur cards adrift on a
gradient background.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Exact card corner radius at the smallest control sizes (badges, pills) —
  resolve during build against the 10/14/20px scale above.
- Whether the organizer's dense setup forms get any glass at all, or stay
  fully solid content the way the STORY block leans; default to fully solid
  unless a chrome-tier element (its own nav bar, its own alerts) needs it.
