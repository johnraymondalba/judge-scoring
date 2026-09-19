---
name: Judging scoresheet
description: A live scoring and tallying scoresheet for judged competitions, in Apple's card-and-glass material system.
colors:
  bg-grouped-light: "#f2f2f7"
  bg-grouped-dark: "#000000"
  bg-surface-light: "#ffffff"
  bg-surface-dark: "#1c1c1e"
  bg-surface-2-light: "#f7f7fa"
  bg-surface-2-dark: "#2c2c2e"
  label-light: "#10101a"
  label-dark: "#ffffff"
  label-2-light: "#55555c"
  label-2-dark: "#b4b4bc"
  label-3-light: "#6a6a72"
  label-3-dark: "#9e9ea6"
  tint-light: "#0062cc"
  tint-dark: "#4da3ff"
  green-light: "#1c7a3e"
  green-dark: "#46d97a"
  amber-light: "#8a5a00"
  amber-dark: "#f5b544"
  red-light: "#c8102e"
  red-dark: "#ff6b6b"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  numeric:
    fontFamily: "ui-rounded, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
rounded:
  group: "20px"
  card-sm: "16px"
  control: "10px"
  pill: "980px"
spacing:
  gutter: "16px"
  inset: "16px"
  row-min: "44px"
components:
  button-primary:
    backgroundColor: "{colors.tint-light}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "{spacing.row-min}"
  button-primary-press:
    backgroundColor: "#004fa6"
  button-tinted:
    backgroundColor: "rgba(0, 98, 204, 0.1)"
    textColor: "{colors.tint-light}"
    rounded: "{rounded.control}"
  card-content:
    backgroundColor: "{colors.bg-surface-light}"
    textColor: "{colors.label-light}"
    rounded: "{rounded.group}"
    padding: "16px"
---

# Design System: Judging scoresheet

<!-- impeccable:design-doc 2 -->

This records the visual system as it actually shipped, read off
`styles/globals.css` and the components that consume it. It is a maintenance
document: when you add a screen, this is the grammar it has to speak.

For what the product is and who uses it, see [PRODUCT.md](PRODUCT.md).

## Overview

**Creative North Star: "The Card-and-Glass Judging Kit"**

The scoresheet replaced its prior "everything is a row" grouped-list grammar
with Apple's own card-and-glass material system — the language of Wallet, App
Store, Health, and Control Center. This was a direct, user-pinned reversal of
the standing preference (see PRODUCT.md, Brand Commitments), not a roll
outcome, and it shipped as a genuine two-material hierarchy: floating,
continuous-corner cards hold every piece of data, and a translucent vibrancy
layer is reserved for chrome alone.

The system declines the web category's glassmorphism pastiche — rainbow blur
cards adrift on a gradient background — in favor of Apple's own restraint: one
tint, three shadow tiers, and glass confined strictly to the elements that
float above content rather than carrying it. A card that holds a score or a
field is always solid and opaque, so text on it keeps full AA contrast
regardless of what is moving in the blur above it.

**Key Characteristics:**
- Two materials, never mixed: solid opaque cards for data, translucent glass for chrome only.
- Three-tier corner scale (20 / 16 / 10px) and three-tier shadow scale (resting / raised / floating), both keyed to a surface's role, not its size.
- One tint carries every interactive element; shadows and glass never substitute for it as an affordance cue.
- A custom on-screen numeric PIN keypad replaces the judge's old text-field PIN entry; no system keyboard appears during sign-in.
- Both themes follow the device, with a manual override, because the judge works in a dimmed auditorium and the organizer on a lit laptop.

## Colors

The palette carries one functional tint and a small semantic set; nothing is decorative.

### Primary
- **Judging Blue** (`#0062cc` light / `#4da3ff` dark, tokens `--tint`): every interactive element and nothing else. If something is tinted, it can be tapped, or it is a value the judge entered. An unscored criterion carries no tint at all.

### Neutral
- **Grouped Ground** (`#f2f2f7` light / `#000000` dark, `--bg-grouped`): the recessed page ground beneath every floating card.
- **Card Surface** (`#ffffff` light / `#1c1c1e` dark, `--bg-surface`): the default solid card fill (elevation tier `--bg-card-1`/`--bg-card-2`).
- **Inset Surface** (`#f7f7fa` light / `#2c2c2e` dark, `--bg-surface-2`): inset areas within a card, e.g. the results breakdown table wrap.
- **Elevated Surface** (`#ffffff` light / `#2c2c2e` dark, `--bg-elevated`): the floating tier — alerts, the PIN sheet.
- **Label** (`#10101a` light / `#ffffff` dark), **Label 2** (`#55555c` / `#b4b4bc`), **Label 3** (`#6a6a72` / `#9e9ea6`): primary, secondary, tertiary text. Label 2 and 3 are deliberately darker than the platform originals they're modelled on (which sit near 3.5:1); every pair here is verified at 4.5:1 or better against both grounds.

### Named Rules
**The One Tint Rule.** `--tint` carries every interactive element and nothing decorative. Shadows and glass are depth cues, never affordance cues.

**The Two Materials, Never Mixed Rule.** Chrome (nav bar, floating action bar, alerts, PIN sheet) is translucent glass; content (every card holding data — criterion cards, participant cards, standing cards, setup fields) is solid and opaque. A card is never blurred; a chrome surface never carries body data directly.

Three semantic colours exist and are used only for state, never decoration: `--green` (complete/scored/confirmed), `--amber` (provisional, needs attention), `--red` (destructive). Each has a `-wash` companion at 10–16% alpha for badges and banners.

## Typography

**Display/Body Font:** `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, "Helvetica Neue", Arial, sans-serif` (`--font`) — the platform UI stack, no webfont, so first paint is the real typeface.
**Numeric Font:** `ui-rounded, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` (`--font-num`), used only for scores, weights, and totals, always with `font-variant-numeric: tabular-nums` so a score dragged from 70 to 80 never reflows its row.

**Character:** A system ramp, restrained and functional — no display face, no decorative weight jump.

### Hierarchy
- **Large Title** (700, `2.125rem`/`2.5rem` above 760px, 1.1): screen headers.
- **Title 1–3 / Headline** (600, `1.75rem`→`1.0625rem`): section and sheet titles (e.g. the PIN sheet title, alert titles).
- **Body** (400, `1.0625rem`): row labels, field values, primary reading text.
- **Subhead / Footnote** (400–600, `0.9375rem`/`0.8125rem`): sublabels, captions, the toolbar note.
- **Section header** — uppercase Footnote (600, 0.04em tracking) in Label 2.

## Layout

One breakpoint, 760px. Below it: a single column at phone density, max content width 720px (1100px for wide/admin views), the floating action bar fixed above `env(safe-area-inset-bottom)`. Above it: the large title grows to 2.5rem, the toolbar returns to static/auto-width flow (a laptop has no home indicator to clear), and form labels take a 220px column so fields align.

Rhythm: `--gutter`/`--inset` at 16px, `--row-min` 44px everywhere without exception (judges tap this in a dimmed room while watching a stage). Two list layouts share the grammar: a flush `.list` (hairline-divided rows, one shared card — used for dense setup/admin lists) and `.list.spaced` (each item its own independent floating card with a 12px gap — used for the role chooser, the judge's criteria, and results standings, where each item is genuinely its own object).

Breakdown tables inside an expanded standing stay horizontally scrollable with a sticky first column rather than collapsing into nested lists, because a judge-by-criterion matrix is genuinely tabular.

## Elevation & Depth

A genuine two-material system, not tonal-only and not glass-everywhere. Depth on solid cards comes from a restrained two-layer shadow (an ambient layer, soft and unoffset, plus a key layer with a small offset and tighter blur), scaled to three roles. Depth on chrome comes from the blur itself — chrome never carries a shadow of its own except at the floating tier, where a PIN sheet or alert needs to visually clear the chrome layer beneath it.

In dark mode, elevation additionally leans on a lighter fill per tier (`--bg-card-2`, `--bg-card-3`) plus a visible hairline edge (`--card-edge`), since a black shadow does not read against a near-black ground.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.08)`, token `--shadow-resting`): the default tier for a card sitting in a list — every criterion card, participant card, and standing card at rest.
- **Raised** (`box-shadow: 0 2px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.12)`, token `--shadow-raised`): an open/expanded criterion card, a focused field's ring companion, the weighted-total summary card, and the slider thumb.
- **Floating** (`box-shadow: 0 4px 8px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.18)`, token `--shadow-floating`): the PIN sheet, alerts, and the bottom action bar — the only elements allowed to sit above the chrome layer itself. This is the shipped, finish-reviewed value; an earlier draft of the direction contract specified a stronger `0 4px 10px / 0 16px 40px` pairing that was not what shipped.

### Named Rules
**The Card Comes Forward Rule.** The signature interaction — tapping a criterion card to unfold its control in place — lifts the card's shadow tier from resting to raised as it opens, so the expansion reads as the card advancing toward the viewer, not merely growing taller.

**The Glass Never Carries Data Rule.** Nothing with a shadow tier above resting is glass except the three named chrome exceptions (nav, floating action bar, alerts, PIN sheet). Every other floating/raised surface is solid.

## Shapes

Corner radius scales with a surface's role, three tiers, not by size or whim:

- `--r-group: 20px` — page-level cards: the default list card, spaced-list items, banners, the floating action bar.
- `--r-card-sm: 16px` — compact chrome sheets: the alert card, the PIN keypad sheet.
- `--r-control: 10px` — controls: buttons, the stepper, the segmented control, the table-wrap inset.
- `--r-pill: 980px` — tracks, progress bars, badges, the rank chip.

The direction contract's original guess of a 14px "nested card" tier was not what shipped; the built scale is the three values above, with no intermediate nested-card radius in use anywhere in the codebase.

Card edges carry a 1px hairline at low alpha (`--card-edge`, 5% black / 9% white) rather than a visible border — present as a definition line, not a stroke. Glass surfaces carry their own, separate hairline (`--glass-edge`) at a different alpha since a translucent surface needs a slightly stronger edge to stay legible over arbitrary content.

## Components

### Buttons
- **Shape:** `--r-control` (10px), min-height `--row-min` (44px).
- **Filled (primary):** `--tint` background, white/`--label-on-tint` text, presses to `--tint-press`.
- **Tinted:** `--tint-wash` background, `--tint` text — the secondary action weight.
- **Plain / Destructive-plain:** text-only, `--tint` or `--red`.
- **Destructive:** `--red` fill for confirm-to-delete actions inside alerts.
- Disabled states keep a legible label (`--fill-1` background, `--label-3` text) rather than fading to illegibility — a build-time fix over a faded tint fill that was barely readable.

### Cards / Containers
- **Corner Style:** 20px (`--r-group`) for a full card; 16px (`--r-card-sm`) for chrome sheets.
- **Background:** solid `--bg-card-1`/`--bg-card-2`/`--bg-card-3` only — never glass.
- **Shadow Strategy:** see Elevation & Depth; resting at rest, raised when open/focused/summary.
- **Border:** 1px `--card-edge` hairline.
- **Internal Padding:** 16px (`--inset`) row padding; 16px/18px top/bottom for expanded card bodies.

### Inputs / Fields
- **Style:** inline `.field-row` (transparent, sits inside a card, 34% label column) for dense setup lists; `.field-stack` (bordered, `--bg-surface-2` fill, `--r-control` radius) for standalone labeled fields.
- **Focus:** `.field-row` washes its background with `--tint-wash` on focus-within, with a keyboard-only `:focus-visible` outline layered on top since the wash alone is too weak (10% alpha) to serve as the keyboard indicator. `.field-stack` gets a tint border plus a 3px `--tint-wash` ring.
- **PIN field (legacy text path, admin PIN reset):** `.pin-field` — tabular numeric, 0.5em letter-spacing, centered.

### Navigation
Sticky glass nav bar (`backdrop-filter: blur(24px) saturate(180%)` over an 82%-opacity `--bg-grouped` tint), a tinted back control naming its destination, a large title beneath that collapses to an inline title (6px translateY + opacity) on scroll, border-bottom hairline appears only once scrolled.

### The PIN Keypad (signature component)
A glass sheet (`--glass-surface-thick`, same blur/saturate as nav) rising from the bottom on phones, centering as a floating card above 520px. Six `--pin-dot` indicators fill with `--tint` as digits land; wrong-length or wrong-PIN entry shakes the dot row once (`420ms` translateX keyframe) and clears. A 4×3 grid of circular glass keys (`--fill-2` fill, `--fill-1` on press, scale(0.96) press feedback) replaces the system keyboard entirely — this is the component that retired the judge's old text-field PIN entry, and it is the one custom control in the system that puts a control-weight fill directly on top of chrome glass rather than on a solid card.

## Do's and Don'ts

### Do:
- **Do** keep every card that holds data (criterion, participant, standing, setup field) solid and opaque at `--bg-card-*`, never blurred.
- **Do** confine `backdrop-filter` to the four named chrome surfaces: nav bar, floating action bar, alerts, PIN sheet.
- **Do** scale corner radius by role — 20px page-level, 16px chrome sheet, 10px control — not by visual size alone.
- **Do** lift a card's shadow tier (resting → raised) when it opens or gains focus, as the honest depth cue for state change.
- **Do** keep `--font-num` with `tabular-nums` on every score, weight, and total so a changing number never reflows its row.
- **Do** follow `prefers-color-scheme` with the manual `data-theme` override, and keep both dark-mode CSS blocks in sync since they are deliberately duplicated to let the override beat the media query without specificity tricks.

### Don't:
- **Don't** apply glass to a surface that carries body text or a score — the auditorium-dim judge's AA contrast depends on staying off the blur.
- **Don't** use a single heavy drop shadow. Every elevated surface uses the two-layer ambient+key pairing at one of the three named tiers.
- **Don't** invent a fourth shadow tier or a nested-card radius outside 20/16/10px; the contract's earlier 14px guess never shipped and should not be revived.
- **Don't** introduce a kicker/eyebrow label, a hard-offset neobrutalist shadow, a glyph icon font, or a system display face — none of these exist in the shipped system, and none should be canonized as a rule for future surfaces even if a future build ships one under time pressure.
