---
version: alpha
name: Meta-inspired-business-reinterpretation
description: A business-dashboard reinterpretation of Meta's hardware-commerce design language — the soft-cloud/white canvas, near-black ink, hairline borders, and minimal shadow all carry over, along with the cobalt-blue accent, but Meta's own two-tier CTA split (black for marketing, cobalt only inside "buy now" flows) doesn't map onto a dashboard with no separate checkout moment, so cobalt (#0064E0) is used as the single accent everywhere instead. Meta's loud marketing-site scale (64px hero headlines, 32px+ photographic card radii, full-bleed product photography) is toned down for a data-dense internal tool used daily by a small marketing team.

colors:
  primary: "#0064e0"
  primary-press: "#0457cb"
  on-primary: "#ffffff"
  link-blue: "#0064e0"
  link-hover: "#0457cb"
  canvas: "#f1f4f7"
  surface-raised: "#ffffff"
  surface-accent: "#e5f0ff"
  ink: "#0a1317"
  ink-mute: "#5d6c7b"
  hairline: "#ced0d4"
  semantic-error: "#e41e3f"
  semantic-success: "#1f7a37"
  chart-amber: "#b8790a"
  chart-teal: "#0a8f86"

typography:
  body:
    fontFamily: system-ui stack (see app/globals.css --font-sans)
    note: No display/heading scale changes from Meta's spec — page h1 stays
      text-xl/font-bold, not the 64px hero-display with ss01/ss02 stylistic sets. A
      literal 64px/48px display ladder would also break table/list-heavy dashboard
      layouts, and Optimistic VF is proprietary anyway.

rounded:
  md: 6px    # was 8px (Apple) — Tailwind --radius-md, matches Meta's rounded.md
  lg: 8px    # was 11px (Apple) — Tailwind --radius-lg, matches Meta's rounded.lg (form inputs)
  xl: 16px   # was 18px (Apple) — Tailwind --radius-xl, matches Meta's rounded.xl (standard feature cards)
  pill: 9999px  # unchanged — already this app's native `rounded-full`, and functionally
                #   identical to Meta's own {rounded.full} (100px) pill-button signature

---

## Overview

Origin: `npx getdesign@latest add meta` produced `meta/DESIGN.md`, a full analysis of
Meta's hardware-commerce marketing language (Quest VR, Ray-Ban Meta glasses) — a
photography-first merchandiser built on a stark white canvas, Optimistic VF display type
running from 64px hero headlines down to 12px captions, and a recognizable two-tier CTA
system: black pill buttons on marketing pages, switching to a saturated cobalt blue
(`#0064E0`) exclusively inside "buy now" / checkout flows, paired with an outlined ghost
secondary button. Applied literally, that spec is built to sell hardware with full-bleed
product photography — not a dashboard whose primary content is dense tables of
procurement notices, ad spend, and DB records, and which has no literal checkout moment
to reserve the two-tier color split for.

This replaces the prior Apple-inspired light theme (see `apple/DESIGN.md` and git history
for that iteration) — both are light-canvas systems, so no light/dark switch was needed
this time; the change is the accent color (Action Blue `#0066cc` → cobalt `#0064E0`) and a
tighter radius scale. This remains a **single fixed theme** — no light/dark toggle, no
`prefers-color-scheme` branching. Every `--color-*` token in `app/globals.css` is set once
in `:root` and used everywhere via Tailwind's semantic classes (`bg-primary`, `text-ink`,
`border-hairline`, etc.), so the whole app reskins from one file — this is the third time
that's been proven true (Slack → Discord → Apple → Meta, four full reskins, zero
component-level color rewrites needed for the base palette swap itself).

## What carried over from Meta, and what didn't

**Carried over:**
- Soft-cloud page canvas (`#f1f4f7`) with white (`#ffffff`) raised surfaces for
  cards/table headers/dropdowns — Meta's own light-mode layering (`surface-soft` base,
  `canvas` white content), same structural pattern as the prior Apple pass.
- Cobalt blue (`#0064E0`) as the single accent color for buttons, links, active states —
  chosen deliberately over Meta's own black-marketing/cobalt-commerce split, confirmed
  with the user, since this app has no separate checkout flow to reserve cobalt for.
- Near-black ink (`#0a1317`, Meta's `ink-deep`) for primary text, `steel` (`#5d6c7b`) for
  muted/secondary text and chart axis labels.
- Hairline borders (`#ced0d4`) and minimal shadow — Meta's own system "runs predominantly
  flat," matching this app's existing near-shadowless card style.
- A tighter, crisper radius scale (6/8/16px vs the prior Apple pass's 8/11/18px) — Meta's
  own `rounded.md/lg/xl` progression, mapped onto this app's `--radius-md/lg/xl` tokens.
- The pill radius (`rounded-full`) — Meta's signature `{rounded.full}` (100px) button
  shape is functionally identical to what this app already used everywhere pre-reskin.

**Deliberately not carried over:**
- 64px hero-display / 48px display-lg headlines with `ss01, ss02` stylistic sets — page
  headers stay `text-xl font-bold`, no OpenType feature changes (Optimistic VF is
  proprietary and irrelevant to a system-font dashboard anyway).
- Meta's two-tier CTA color split (black marketing / cobalt commerce) — every button and
  link in this app uses cobalt uniformly; there's no "marketing surface" vs "buy now flow"
  distinction to preserve.
- Full-bleed photographic feature cards, promo banners, dual-CTA hero patterns — this app
  has no product photography and no marketing hero sections.
- Oculus purple as a page-chrome color — reserved for the multi-series chart palette only
  (treemap, SOV bar chart), same treatment as the other borrowed brand/semantic hues.

## Colors

Full token list lives in `app/globals.css` (`:root` custom properties, re-exported via
Tailwind's `@theme inline`). Summary:

| Token (Tailwind class suffix) | Value | Use |
|---|---|---|
| `primary` | `#0064e0` | Buttons, links-as-actions, active nav, brand mark |
| `primary-press` | `#0457cb` | Hover/press state of primary buttons (Meta's own `primary-deep`) |
| `link-blue` | `#0064e0` | Inline text links — same hex as primary, single-accent rule |
| `link-hover` | `#0457cb` | Link hover state |
| `canvas-cream` | `#ffffff` | Raised white surface — cards, table headers, dropdowns, tooltips (legacy "cream" name kept from the pre-Discord Slack palette to avoid a repo-wide rename) |
| `canvas-lavender` | `#e5f0ff` | Selected/active chip background (light cobalt tint, close to Meta's own `primary-soft` 15%-alpha callout tint), also used at `/20` opacity for subtle highlight rows |
| `ink` | `#0a1317` | Primary text on the light canvas (Meta's `ink-deep`) |
| `ink-mute` | `#5d6c7b` | Secondary/muted text, chart axis labels and gridlines (Meta's `steel`) |
| `hairline` | `#ced0d4` | Borders, dividers, chart gridlines (Meta's own hairline token, used verbatim) |
| `semantic-error` | `#e41e3f` | Destructive actions, form errors (Meta's `critical`) |
| `semantic-success` | `#1f7a37` | Success states, confirmations — darkened from Meta's `success` (`#31a24c`) for AA text contrast on white |

Ad-hoc chart accent hexes (not full design tokens, used only where 2–4 chart series need
visually separable hues and the single-accent rule doesn't apply): `#e41e3f` (red, reuses
`semantic-error`), `#b8790a` (amber, darkened from Meta's `attention` `#f2a918` for text
contrast), `#0a8f86` (teal — not a real Meta token, kept as a generic UI convenience
color since Meta's palette has no teal). The treemap and SOV bar-chart palettes use real
Meta brand/semantic colors instead (`#0064e0`, `#1f7a37`, `#f2a918`, `#e41e3f`, `#a121ce`
Oculus purple, `#1876f2` fb-blue, `#385898` meta-link, `#5d6c7b` steel) since those are
graphical fills, not text, and don't carry the same contrast requirement.

## Do's and Don'ts

### Do
- Reference `bg-primary` / `text-ink` / `border-hairline` / etc. — never hardcode a hex or
  `bg-white` for anything meant to sit on the app canvas (this is what let four full
  reskins happen by editing one CSS file each time).
- Keep table/list body text at the existing small sizes (`text-xs`/`text-sm`) — this is a
  data tool, not a hardware-showcase page; Meta's 16px-minimum-body instinct does not
  apply to a dashboard this dense.
- Use `var(--color-hairline)` / `var(--color-ink-mute)` / `var(--color-canvas-cream)` /
  `var(--radius-md)` for Recharts `stroke`/`contentStyle` props, since those can't take
  Tailwind classes directly.
- Reserve `primary` (cobalt) as the only accent in page chrome — buttons, links, active
  nav/tab states. Multi-series charts are the one place other brand/semantic hues appear.

### Don't
- Don't reintroduce Meta's black-vs-cobalt CTA split — every button in this app is cobalt,
  full stop; there's no "marketing surface" here to carve out a second CTA color for.
- Don't add drop shadows to cards or buttons — depth here comes from the hairline border
  and the soft-cloud/white surface split, matching Meta's own "runs predominantly flat"
  philosophy.
- Don't set any heading past the existing `text-xl` page-header scale or add Optimistic
  VF's `ss01, ss02` styling — there's no such font loaded, and 64px would break every
  page-header layout in this app.
- Don't add `prefers-color-scheme` branching or a dark-mode fallback — this is a single
  committed light theme; a stray dark-mode media query will silently produce
  unreadable dark-on-dark or light-text-on-light-bg patches.
- Don't reuse the darkened chart-accent hexes (`#b8790a` etc.) as page-chrome colors —
  they exist only for chart-label contrast on white, not as a second brand accent.
