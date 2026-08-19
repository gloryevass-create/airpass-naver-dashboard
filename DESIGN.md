---
version: alpha
name: Discord-inspired-business-reinterpretation
description: A business-dashboard reinterpretation of Discord's design language — the deep-indigo canvas and Blurple brand color carry over, but the loud marketing-site scale (82px all-caps display type, 40px+ media radii, neon green/magenta CTA bands) is toned down for a data-dense internal tool used daily by a small marketing team. Body text stays small and tables stay dense; Blurple, an electric green/teal accent chord, and a warm red/amber pair carry category distinction in charts and KPI labels instead of literal brand gradients.

colors:
  primary: "#5865f2"
  primary-press: "#4752c4"
  on-primary: "#ffffff"
  link-blue: "#00b0f4"
  link-hover: "#3dd0ff"
  canvas: "#10132f"
  surface-raised: "#1c2150"
  surface-accent: "#262b66"
  ink: "#f1f2ff"
  ink-mute: "#9aa0c9"
  hairline: "#2e3372"
  semantic-error: "#ed4245"
  semantic-success: "#35ed7e"
  chart-red: "#ff6b6b"
  chart-amber: "#ffb84d"
  chart-teal: "#2dd4bf"

typography:
  body:
    fontFamily: system-ui stack (see app/globals.css --font-sans)
    note: No display/heading scale changes from Discord's spec — page h1 stays
      text-xl/font-bold, not the 82px all-caps display type. Discord's ABC Ginto Nord
      is proprietary anyway; a literal display scale would also hurt table/list
      readability in a dashboard this data-dense.

rounded:
  md: 10px   # was 6px — Tailwind --radius-md
  lg: 14px   # was 8px — Tailwind --radius-lg
  xl: 24px   # was 12px — Tailwind --radius-xl (Discord itself uses 40px on marketing
             #   media panels; capped lower here so bordered table/list containers,
             #   which use rounded-xl throughout this app, don't look absurd)
  full: 9999px  # unchanged, used heavily for pills/badges/avatars already

---

## Overview

Origin: `npx getdesign@latest add discord` produced `discord/DESIGN.md`, a full analysis
of Discord's *marketing landing page* language (deep-indigo canvas washed by an animated
Blurple→magenta gradient mesh, heavy all-caps ABC Ginto Nord display type, 40–120px media
radii, full-bleed neon-green CTA bands). Applied literally, that spec is built for a
scroll-and-convert marketing site, not a dashboard where the primary content is dense
tables of procurement notices, ad spend, and DB records. This file documents what was
**actually** applied to `airpass-naver-dashboard`: Discord's core identity (indigo canvas,
Blurple brand color, soft generous rounding, minimal shadow) reinterpreted at a scale that
keeps small text and table rows legible.

This is a **single fixed dark theme** — there is no light/dark toggle and no
`prefers-color-scheme` branching; every `--color-*` token in `app/globals.css` is set once
in `:root` and used everywhere via Tailwind's semantic classes (`bg-primary`, `text-ink`,
`border-hairline`, etc.), so the whole app reskins from one file. Component code should
**never** hardcode a color (`bg-white`, `text-[#...]`, raw hex chart strokes) — always
reference a token, or the app silently reverts to unreadable light-on-dark or
dark-on-dark patches the next time this palette changes.

## What carried over from Discord, and what didn't

**Carried over:**
- Deep-indigo canvas (`#10132f`) as the single page background, replacing the previous
  Slack-inspired cream/white base.
- Blurple (`#5865f2`) as the one brand/primary action color — buttons, active states,
  focus rings, brand mark (`AppLogo`).
- Discord's link cyan (`#00b0f4`) for inline links and one KPI label slot per chart.
- Electric green (`#35ed7e`) reserved for `semantic-success` only (matches Discord's own
  rule: green is the highest-intent signal, never a general accent).
- Generous, soft rounding — bumped via Tailwind's `--radius-md/lg/xl` theme tokens so
  every existing `rounded-md/lg/xl` class in the codebase picked it up automatically,
  no per-component edits needed.
- Minimal shadow, color/contrast-driven depth instead — matches Discord's own principle
  and required no change since this codebase barely used shadows to begin with.

**Deliberately not carried over:**
- 82px all-caps ABC Ginto Nord display type — page headers stay `text-xl font-bold`.
- 40–120px media/card radii — capped at 24px (`--radius-xl`) so bordered table/list
  containers stay proportionate.
- Magenta (`#ec48bd`) as a page-level accent band/CTA color — used narrowly instead, only
  inside the multi-series chart palettes (treemap cells, SOV bar chart) where a fourth
  hue is needed to distinguish series, never as a UI-chrome color.
- Neon-green CTA buttons — `button-primary` stays Blurple; green is success-state only.

## Colors

Full token list lives in `app/globals.css` (`:root` custom properties, re-exported via
Tailwind's `@theme inline`). Summary:

| Token (Tailwind class suffix) | Value | Use |
|---|---|---|
| `primary` | `#5865f2` | Buttons, links-as-actions, active nav, brand mark |
| `primary-press` | `#4752c4` | Hover/press state of primary buttons |
| `link-blue` | `#00b0f4` | Inline text links, one KPI label per stat panel |
| `link-hover` | `#3dd0ff` | Link hover state |
| `canvas-cream` | `#1c2150` | Raised dark surface — table headers, dropdowns, tooltips, hover states (despite the legacy "cream" name kept from the pre-Discord Slack palette to avoid a repo-wide rename) |
| `canvas-lavender` | `#262b66` | Selected/active chip background (e.g. active sidebar item), also used at `/20` opacity for subtle highlight rows |
| `ink` | `#f1f2ff` | Primary text on the dark canvas |
| `ink-mute` | `#9aa0c9` | Secondary/muted text, chart axis labels and gridlines |
| `hairline` | `#2e3372` | Borders, dividers, chart gridlines |
| `semantic-error` | `#ed4245` | Destructive actions, critical alerts |
| `semantic-success` | `#35ed7e` | Success states, confirmations |

Ad-hoc chart accent hexes (not full design tokens, used only for multi-series KPI/line
distinction where 2–4 series need visually separable hues): `#ff6b6b` (red), `#ffb84d`
(amber), `#2dd4bf` (teal) — paired with `link-blue` as the fourth series color where a
chart needs exactly four.

## Do's and Don'ts

### Do
- Reference `bg-primary` / `text-ink` / `border-hairline` / etc. — never hardcode a hex
  or `bg-white` for anything meant to sit on the app canvas.
- Keep table/list body text at the existing small sizes (`text-xs`/`text-sm`) — this is a
  data tool, not a landing page; Discord's loud-type instinct does not apply here.
- Use `var(--color-hairline)` / `var(--color-ink-mute)` / `var(--color-canvas-cream)` for
  Recharts `stroke`/`contentStyle` props, since those can't take Tailwind classes directly.
- Reserve `semantic-success` (green) for genuine success/confirmation states only.

### Don't
- Don't reach for Discord's magenta or neon green as a general UI accent — Blurple is the
  only brand color that appears in page chrome (buttons, active states, links).
- Don't set any heading in ALL-CAPS or bump display type past the existing `text-xl`
  page-header scale — it will not read as "confident," it will read as broken.
- Don't add `prefers-color-scheme` branching or a light-mode fallback — this is a single
  committed dark theme; a stray light-mode media query will silently produce
  unreadable light-on-light or dark-text-on-dark-bg patches.
