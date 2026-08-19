---
version: alpha
name: Apple-inspired-business-reinterpretation
description: A business-dashboard reinterpretation of Apple's design language — near-black ink text, single Action Blue accent, hairline borders, and near-absent shadow all carry over, but the canvas is pure white (per explicit user request, rather than Apple's own parchment #f5f5f7) and the loud marketing-site scale (56px negative-tracking headlines, 80px section padding, full-bleed edge-to-edge tiles) is toned down for a data-dense internal tool used daily by a small marketing team. Body text stays small and tables stay dense.

colors:
  primary: "#0066cc"
  primary-press: "#0071e3"
  on-primary: "#ffffff"
  link-blue: "#0066cc"
  link-hover: "#0071e3"
  canvas: "#ffffff"
  surface-raised: "#ffffff"
  surface-accent: "#e8f2ff"
  ink: "#1d1d1f"
  ink-mute: "#7a7a7a"
  hairline: "#e0e0e0"
  semantic-error: "#d70015"
  semantic-success: "#248a3d"
  chart-red: "#d9342b"
  chart-amber: "#c2760a"
  chart-teal: "#0a8f86"

typography:
  body:
    fontFamily: system-ui stack (see app/globals.css --font-sans)
    note: No display/heading scale changes from Apple's spec — page h1 stays
      text-xl/font-bold, not the 56px hero-display with -0.28px tracking. A literal
      56px/40px display ladder would also break table/list-heavy dashboard layouts.

rounded:
  md: 8px    # Tailwind --radius-md, matches Apple's rounded.sm
  lg: 11px   # Tailwind --radius-lg, matches Apple's rounded.md
  xl: 18px   # Tailwind --radius-xl, matches Apple's rounded.lg (standard feature cards)
  pill: 9999px  # unchanged, used heavily for pills/badges/avatars already — this IS
                #   the one Apple radius grammar (rounded.pill) already native to this app

---

## Overview

This app has cycled through several `getdesign`-sourced palettes (Slack → Discord → Apple
→ Meta → **Apple again**). This file documents the current, reapplied state: Apple's core
identity (near-black ink, single Action Blue accent, hairline borders, near-zero shadow,
Apple's own tighter/crisper radius scale) layered onto a **pure white** page canvas — the
white-canvas choice is a standing, explicit user preference that now overrides Apple's own
parchment (`#f5f5f7`) default from the first Apple pass, and should be preserved across
any future palette swap unless the user says otherwise.

This remains a **single fixed theme** — no light/dark toggle, no `prefers-color-scheme`
branching. Every `--color-*` token in `app/globals.css` is set once in `:root` and used
everywhere via Tailwind's semantic classes (`bg-primary`, `text-ink`, `border-hairline`,
etc.), so the whole app reskins from one file — proven true across five full reskins now,
zero component-level color rewrites needed for the base palette swap itself.

## What carried over from Apple, and what didn't

**Carried over:**
- Action Blue (`#0066cc`) as the **only** brand/primary action color — buttons, links,
  active states, focus — matching Apple's "single accent, non-negotiable" rule.
- Near-black ink (`#1d1d1f`) instead of pure black for all text — keeps the page feeling
  photographic/soft rather than printed, per Apple's own stated reasoning.
- Hairline borders (`#e0e0e0`) and near-zero shadow — cards separate by a 1px border, not
  elevation.
- Tighter, crisper radius scale (8/11/18px) — Apple's own `rounded.sm/md/lg` progression,
  mapped onto this app's `--radius-md/lg/xl` theme tokens.
- The pill radius (`rounded-full`, already used across this app before any reskin) is
  literally Apple's signature CTA shape — no change needed, it was already there.

**Deliberately not carried over:**
- Apple's own parchment page canvas (`#f5f5f7`) — this app uses pure white (`#ffffff`)
  instead, per explicit user request. White raised surfaces (cards, table headers,
  dropdowns) sit on the same white base, separated only by hairline borders — a flatter
  look than Apple's own parchment/white two-tier layering, and intentional.
- 56px hero-display / 40px display-lg headlines with negative letter-spacing — page
  headers stay `text-xl font-bold`, no tracking changes.
- 80px section padding and full-bleed edge-to-edge tiles — this app's existing card/table
  padding (`p-3`–`p-6`) is unchanged.
- Alternating light/dark tile sections as the page rhythm — a single dashboard page here
  isn't a scroll-and-convert marketing stack; every surface stays on the same light canvas.
- "No gradients" and "exactly one shadow, reserved for product photography" — moot; this
  app has no product photography and wasn't using gradients or heavy shadows before either.

## Colors

Full token list lives in `app/globals.css` (`:root` custom properties, re-exported via
Tailwind's `@theme inline`). Summary:

| Token (Tailwind class suffix) | Value | Use |
|---|---|---|
| `primary` | `#0066cc` | Buttons, links-as-actions, active nav, brand mark |
| `primary-press` | `#0071e3` | Hover/press/focus state of primary buttons (Apple's own "Focus Blue" sibling) |
| `link-blue` | `#0066cc` | Inline text links — same hex as primary, per Apple's single-accent rule |
| `link-hover` | `#0071e3` | Link hover state |
| `canvas-cream` | `#ffffff` | Raised white surface — cards, table headers, dropdowns, tooltips (legacy "cream" name kept from the pre-Discord Slack palette to avoid a repo-wide rename); now the same hex as the page background itself (`--background`), per the white-canvas decision above |
| `canvas-lavender` | `#e8f2ff` | Selected/active chip background (light Action-Blue tint), also used at `/20` opacity for subtle highlight rows |
| `ink` | `#1d1d1f` | Primary text on the light canvas |
| `ink-mute` | `#7a7a7a` | Secondary/muted text, chart axis labels and gridlines (Apple's `ink-muted-48`) |
| `hairline` | `#e0e0e0` | Borders, dividers, chart gridlines (Apple's own hairline token, used verbatim) |
| `semantic-error` | `#d70015` | Destructive actions, form errors — darkened from Apple's iOS systemRed (`#ff3b30`) for AA text contrast on white |
| `semantic-success` | `#248a3d` | Success states, confirmations — darkened from Apple's systemGreen (`#34c759`) for the same reason |

Ad-hoc chart accent hexes (not full design tokens, used only where 2–4 chart series need
visually separable hues and the "single accent" rule doesn't apply): `#d9342b` (red),
`#c2760a` (amber), `#0a8f86` (teal). The treemap and SOV bar-chart palettes use real Apple
system colors instead (`#0066cc`, `#34c759`, `#ff9500`, `#ff3b30`, `#af52de`, `#30b0c7`,
`#ff2d55`, `#5856d6`) since those are graphical fills, not text, and don't carry the same
contrast requirement.

## Do's and Don'ts

### Do
- Reference `bg-primary` / `text-ink` / `border-hairline` / etc. — never hardcode a hex or
  `bg-white` for anything meant to sit on the app canvas (this is what let five full
  reskins happen by editing one CSS file each time).
- Keep table/list body text at the existing small sizes (`text-xs`/`text-sm`) — this is a
  data tool, not a product-showcase page; Apple's 17px-minimum-body instinct does not
  apply to a dashboard this dense.
- Use `var(--color-hairline)` / `var(--color-ink-mute)` / `var(--color-canvas-cream)` /
  `var(--radius-md)` for Recharts `stroke`/`contentStyle` props, since those can't take
  Tailwind classes directly.
- Reserve `primary` (Action Blue) as the only accent in page chrome — buttons, links,
  active nav/tab states. Multi-series charts are the one place other hues appear.
- Keep the page background pure white (`#ffffff`) — this overrides Apple's own parchment
  default and should persist across any future palette swap unless the user says otherwise.

### Don't
- Don't add drop shadows to cards or buttons — depth here comes from the hairline border,
  matching Apple's own near-zero-shadow philosophy.
- Don't set any heading past the existing `text-xl` page-header scale or add negative
  letter-spacing — it will not read as "Apple tight," it will read as a rendering bug at
  this text size.
- Don't add `prefers-color-scheme` branching or a dark-mode fallback — this is a single
  committed light theme; a stray dark-mode media query will silently produce
  unreadable dark-on-dark or light-text-on-light-bg patches.
- Don't reuse the darkened chart-accent hexes (`#d9342b` etc.) as page-chrome colors —
  they exist only for chart-label contrast on white, not as a second brand accent.
- Don't silently reintroduce a parchment/gray page background on the next palette swap —
  the white canvas is a standing user preference, not an Apple-specific detail.
