---
target: judge-scoring app (JudgePanel + full surface)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 4
target_identity: "file:C:\\Users\\Asus\\Downloads\\food-tech-judging\\judge-scoring\\components\\JudgePanel.js"
target_fingerprint: "sha256:7736050a8778d287f35ab01911308d58d760d9f67adffc75a608d81858795106"
target_path: "C:\\Users\\Asus\\Downloads\\food-tech-judging\\judge-scoring\\components\\JudgePanel.js"
timestamp: 2026-09-18T14-44-59Z
slug: components-judgepanel-js
---
Method: dual-agent (A: a6edacae design review | B: a78fecfd detector + measurement).
No browser automation available; all measurements computed from declared CSS and JSX.

## Design Health Score: 23/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Footer promises judges "scores refresh every 6s"; judges cannot see scores (organizer-only leaderboard) |
| 2 | Match System / Real World | 2 | "Coverage" is analytics jargon; gavel is a courtroom metaphor for a student pitch contest |
| 3 | User Control and Freedom | 2 | Submission irreversible, no review step, drafts destroyed without confirm |
| 4 | Consistency and Standards | 2 | .btn-icon:hover turns every text button red; .btn.danger defined and never used |
| 5 | Error Prevention | 2 | Blank-score discipline undone by slider thumb rendering at 50; weights != 100 savable |
| 6 | Recognition Rather Than Recall | 3 | "You already scored this" banner does not show what was scored |
| 7 | Flexibility and Efficiency | 3 | Auto-advance good; no keyboard path through results table |
| 8 | Aesthetic and Minimalist | 2 | Criterion 1 at or below the fold on 375x667 |
| 9 | Error Recovery | 2 | 401 on submit calls signOut() and discards the draft silently |
| 10 | Help and Documentation | 2 | No rubric anchors; 0-100 uncalibrated across judges, averaged to 2dp |

## Design Specificity Verdict

Category-interchangeable. Strip "Judge/Organizer/Participant/Criterion" and this ships
unchanged as an expense-approval tool or vendor scorecard. Only product-specific gesture is
the gavel icon, and it is the wrong metaphor. The 3-minute pitch / 7-minute Q&A structure
that defines the physical event appears nowhere in the interface.

Deterministic scan: impeccable detect over components/ and pages/ returned 0 findings,
exit 0. Verified genuine (no config suppression, no inline ignores; synthetic probe file
tripped the engine). styles/globals.css was NOT in the target set, so the stylesheet is
uncertified. No browser overlay was produced - no browser automation in session.

## Cognitive Load: 5 of 8 failures (CRITICAL)

FAIL: single focus, chunking, one-thing-at-a-time, minimal choices, working memory.
PASS: visual grouping, visual hierarchy, progressive disclosure.

Decision points over 4 options: judges table row (7 affordances, ~21 elements across 3
judges); participant choice (select + chip row = 6 affordances for 3 options); scoring form
(10 inputs before Submit).

## What's Working

1. Null-score model correct end-to-end: blankDraft seeds null, unscored visual state,
   aria-valuetext "not scored yet", weightedTotal guards with weightSeen, Submit disabled.
2. One back control, one location, wired to hardware back button via popstate guard.
3. Touch-target discipline motivated by the device: 16px inputs to defeat iOS focus zoom,
   viewport-fit=cover, 30px slider thumb over 8px track.

## Priority Issues

[P0] Draft destroyed by one accidental tap. JudgePanel.js:85-102, 204-217.
draftScores is React-state only. Four destruction routes; the chip (~26.5px, smallest
control in the app) sits in the thumb path. Fix: persist to localStorage keyed
draft::judgeId::participantId, confirm before switching a dirty draft, raise chip to 44px,
inline re-auth on 401 instead of signOut.

[P0] Untouched slider renders thumb at 50. JudgePanel.js:32.
value={has ? value : 50}. One brush commits a real 50 and clears the unscored safeguard.
Fix: render the thumb at an explicit unscored position or hide it until first input.

[P0] Organizer deletions unconfirmed, rewrite submitted scores. AdminPanel.js:120,213,385.
weightedTotal scales by weight seen, so removing a criterion after 9 scores silently changes
all 9 totals. Weights != 100 savable. Fix: route removals through ConfirmDialog with
affected-score count; block save while weightSum != 100.

[P1] Masthead contrast failure. globals.css:878-884 (.who = --blue-900 ~2.1:1) and 458-466
(.btn-icon = --ink-soft ~1.2:1) on the blue-700->blue-500 gradient. "Judging as {name}" is
the only guard against submitting under a colleague's identity. Fix: white on translucent.

[P1] Yellow means both "do this" and "something is wrong". .btn.accent shares its hue with
.pill.warn, unscored card borders, empty number fields. --ok is byte-identical to
--blue-500. Fix: move primary to blue-600 or a success green; reserve yellow for warning.

[P1] Emotional peak unattended. Submit is irreversible with no review step and no confirm,
while ConfirmDialog is spent on sign-out. submit() swaps the team and scrolls away from the
0.74rem confirmation pill. No completion state when all participants are done.

[P1] Keyboard-only organizers cannot open a results breakdown. ResultsPanel.js:87-93,
onClick on a bare <tr> with no tabIndex/role/aria-expanded/key handler.

[P2] Leaderboard shows a confident gold winner after 1 of 3 judges; ties silently ordered.

## Persona Red Flags

Casey (one thumb, interrupted): 26.5px chip detonates draft; touch-action pan-y makes
horizontal thumb drag a score change; nothing survives a phone lock; confirmation scrolls
away at the moment it appears.

Sam (screen reader, 200% zoom): results breakdown keyboard-unreachable; aria-modal without
focus trap; connection loss not announced; auto-advance strands focus on a Submit button
belonging to a different team; slider and number field carry two accessible names for one
value.

Riley (stress tester): refresh mid-scoring returns to participant list with progress "0 of
3"; two rapid back presses can exit the app; pasting non-numeric text leaves DOM showing
garbage while state holds the old value; CSV revokeObjectURL races a.click().

## Questions to Consider

1. Why does a judge choose a participant at all? If the organizer marked who is on stage,
   the select, chip row, auto-advance and the whole class of draft-destroying navigation
   would cease to exist.
2. Why 0-100 per criterion? No human discriminates 82 from 84 after a 3-minute pitch, yet
   averages are reported to 2dp. A 5-point rubric with written anchors would improve
   calibration and halve the inputs.
3. What does the organizer need in the final minute - a seven-column table, or the sentence
   "Team Omefi wins, 87.4, all 9 scores in"?
4. If the organizer is three feet away, why a PIN at all rather than a one-tap claim link?
