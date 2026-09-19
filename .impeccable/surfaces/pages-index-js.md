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

**THESIS.** The scoresheet is a system app, not a branded web dashboard. It
refuses the category's card deck — gradient masthead, pill chips, bespoke blue,
drop-shadowed panels — and adopts the inset grouped-list grammar the judge's own
phone already uses, so a faculty member who has never seen it still knows how it
works. Everything is a row; a score is a row's value.

**OWN-WORLD.** Two adaptive grounds (grouped background, elevated surface) that
invert cleanly between light and dark, driven by `prefers-color-scheme` with a
manual override. One tint colour carries every interactive element and nothing
decorative. System type ramp, large title down to caption, with uppercase
footnote section headers. Hairline separators inset to the text origin, never
full-bleed. 12px continuous corners on grouped containers, no card shadows. 44px
minimum row height everywhere. Recognisable with all content removed by the
inset-group rhythm and the absence of ornament.

**STORY.** The judge opens the link, recognises the shape of their own phone's
settings, and picks a role without reading. They sign in, see participants as a
list whose rows carry their own scoring state, tap one, and score five criteria
as five rows. They believe the number they submitted is the number recorded. The
organizer gets the same grammar at laptop density.

**FIRST VIEWPORT** (judge, scoring). Large title naming the participant, its
position in the running order as subtitle, collapsing to an inline title on
scroll. One grouped list of five criterion rows: name leading, weight as
secondary text, score as a large tint-coloured value trailing; an unscored row
shows an em-dash in tertiary grey and carries no tint at all. A second one-row
group beneath shows the weighted total. The primary action is a full-width
filled button pinned above the bottom safe area, with "2 of 3 participants
scored" as a caption under it. **Signature interaction:** tapping a criterion row
unfolds the control inside the row rather than navigating away, so the judge
never loses their place in the list; the row's value animates only on commit,
never during the drag. **Motion grammar:** height and opacity only, 200ms ease-out,
fully suppressed under `prefers-reduced-motion`.

**FORM.** The category standard (canon), taken as the standing exit after the
roll assigned The Conductor's Score and two challengers beat it; the user chose
convention deliberately. Executed at the craft level of Apple's system apps,
played straight with no irony and nothing smuggled in from the declined
directions. Not a position on the grounded candidate list. Seed key 78dadada.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Whether the organizer's results table becomes a grouped list at phone width or
  stays a horizontally scrolled table.
- Where the theme override control lives.
