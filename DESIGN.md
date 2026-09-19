# Design system

<!-- impeccable:design-doc 1 -->

This records the visual system as it actually shipped, read off
`styles/globals.css` and the components that consume it. It is a maintenance
document: when you add a screen, this is the grammar it has to speak.

For what the product is and who uses it, see [PRODUCT.md](PRODUCT.md).

## Thesis

The scoresheet is a system app, not a branded web dashboard. It declines the
category's card deck — gradient masthead, bespoke blue, drop-shadowed panels —
and adopts the inset grouped-list grammar the judge's own phone already uses, so
a faculty member who has never seen it still knows how it works.

**Everything is a row; a score is a row's value.** That single sentence resolves
most layout questions. A new piece of information is a row in a group, not a new
card, panel, or widget.

## Grounds

Two adaptive grounds, and only two:

| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `--bg-grouped` | the recessed page ground | `#f2f2f7` | `#000000` |
| `--bg-surface` | the raised group sitting on it | `#ffffff` | `#1c1c1e` |
| `--bg-surface-2` | inset areas within a surface | `#f7f7fa` | `#2c2c2e` |
| `--bg-elevated` | alerts and sheets above everything | `#ffffff` | `#2c2c2e` |

The pair inverts between modes rather than being tinted: the light ground is
darker than its surfaces, the dark ground is darker than its surfaces. Nothing
else is a background. There are no card shadows anywhere in the system — a group
reads as raised purely because its ground is recessed.

Theme follows `prefers-color-scheme`, with a manual override written to
`data-theme` on the root element and persisted under the `judging_theme` key.
The override control is the single icon button at the right of the navigation
bar, cycling system → light → dark. Both dark blocks in the CSS
(`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and
`:root[data-theme="dark"]`) must be edited together; they are deliberately
duplicated so the override beats the media query without specificity tricks.

## Colour

One tint carries every interactive element and nothing decorative:
`--tint` (`#0062cc` light, `#4da3ff` dark). If something is tinted, it can be
tapped, or it is a value the judge entered. An unscored criterion carries no
tint at all — its em-dash is `--label-3` — which is what makes a half-finished
sheet legible at a glance.

Three semantic colours exist and are used only for state, never for decoration
or category: `--green` (complete, scored, confirmed), `--amber` (provisional,
missing PIN, needs attention), `--red` (destructive). Each has a `-wash`
companion at 10–16% alpha for badge and banner backgrounds.

**Contrast is a commitment, not a default.** `--label-2` and `--label-3` are
deliberately darker than the platform originals they are modelled on, which sit
near 3.5:1. Every label token here is verified at 4.5:1 or better against both
`--bg-grouped` and `--bg-surface`. If you introduce a new label tone, verify it
against both grounds in both modes before shipping it.

## Type

A system ramp, `--f-large-title` (2.125rem, 2.5rem above 760px) down to
`--f-caption` (0.75rem), in `--font` — the platform UI stack, no webfont, so the
first paint is the real typeface. Section headers are uppercase `--f-footnote`
in `--label-2`.

Numbers — scores, weights, totals — use `--font-num` with
`font-variant-numeric: tabular-nums`. This is load-bearing rather than
cosmetic: a score dragged from 70 to 80 must not reflow the row it sits in.

## Geometry and rhythm

- `--r-group: 12px` continuous corners on grouped containers, `--r-control: 10px`
  on buttons and fields, `--r-pill: 980px` on tracks and badges.
- `--row-min: 44px` minimum row height, everywhere, without exception. Judges
  tap this in a dimmed room while watching a stage.
- `--gutter: 16px` page gutter, `--inset: 16px` row padding.
- Hairline separators are inset to the text origin, never full-bleed, and the
  last row in a group has none. The exception is inside a breakdown table, where
  a full-width rule is the correct table grammar.

## Components

**Navigation bar** — sticky, with a tinted back control on the left naming its
destination ("‹ Participants", "‹ Roles") rather than a bare chevron, and the
appearance toggle on the right. A large title sits below it and collapses to an
inline title on scroll.

**Grouped list** — `.group` wrapping an uppercase `.group-header`, a `.list` of
`.row`s, and an optional `.group-footer` carrying the explanatory sentence. The
footer is where instructions live; rows stay terse.

**Row** — leading icon or rank, `.row-main` with `.row-label` and optional
`.row-sublabel`, then `.row-trail` with the value and a chevron. A row is a
`<button>` when it does something.

**Expandable row** — the signature interaction. Tapping a criterion or a standing
unfolds its control *inside* the row instead of navigating away, so the judge
never loses their place in the list. Implemented as a
`grid-template-rows: 0fr → 1fr` transition over `--dur` (240ms) on `--ease`,
which animates height without a measured pixel value. The row's trailing score
has no transition of its own, so it never animates during a drag — only the
disclosure moves.

**Toolbar** — the primary action, full-width and filled, sticky to the bottom
above `env(safe-area-inset-bottom)` with a blurred ground, and a
`.toolbar-note` caption beneath it carrying progress ("5 of 5 criteria still
need a score"). Above 760px it becomes static and auto-width, because a laptop
has no home indicator to clear.

**Banners and badges** — a banner is a full-width washed strip with an icon and
one sentence; a badge is a small washed pill carrying one or two words of state.
Both draw from the semantic colours only.

## Motion

Height and opacity, with one exception. The only transform in the system is the
6px `translateY` that lifts the collapsed navigation title into place as it
fades in; there is no spring and no staggering anywhere. `--dur: 240ms`
on `--ease: cubic-bezier(0.32, 0.72, 0, 1)`. Under
`prefers-reduced-motion: reduce` every duration collapses to 1ms globally: the
state change still lands, only the travel between states is removed.

## Responsive

One breakpoint, 760px. Below it the layout is a single column at phone density.
Above it the large title grows, the toolbar unpins, buttons stop being
full-width, and form labels take a 220px column so fields align. There is no
tablet-specific layout and no desktop sidebar — the organizer gets the same
grammar at laptop density, which is the point.

Breakdown tables inside an expanded standing stay horizontally scrollable with a
sticky first column rather than collapsing into nested lists, because a judge-by-
criterion matrix is genuinely tabular and reads worse as anything else.

## Assets

None. Every icon in the product is an inline SVG in
[components/Icon.js](components/Icon.js), drawn on a 24px grid and inheriting
`currentColor`. There are no raster assets, no icon font, and no `public/`
directory. Adding an icon means adding a path to that file, so the set stays
visibly one family.
