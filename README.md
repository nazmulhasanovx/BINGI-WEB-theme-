# BinGi Web Themes

Hotel website themes for **BinGi Hotel Management Technology** (by NEONECY).
Every hotel on BinGi gets a public website + direct booking engine, fed by the same data it manages in BinGi HMS.

## How this repo works

**One repo, one `main` branch.** All master themes live side by side as folders; they share the booking engine, data contract and every inner page. Only the **Home layout and shape** differ per theme. Feature branches (`feature/<name>`) are short-lived and merge back into `main`.

| Master theme | Plan | Demo hotel | Folder | Status |
|---|---|---|---|---|
| **NEST** — small hotel, guest house, home | Starter | `/hotel/tea-valley` | `src/themes/nest` | Front-end done, demo data |
| **CITY** — premium city/business hotel | Business | `/hotel/sea-pearl` | `src/themes/city` | Front-end done, demo data |
| **GRAND** — luxury hotel & resort | Ultra / Enterprise | `/hotel/azure-bay` | `src/themes/grand` | Front-end done, demo data |

How a hotel's site is chosen: **plan → master theme**, **property type → category preset** (`src/lib/presets.ts`, labels + special sections), **owner → colour (10) + heading font**, **HMS → content**. Restaurant and Events pages exist only on Ultra/Enterprise (`PLAN_RULES` in `src/lib/data.ts`). Full rules: [`RULES.md`](RULES.md).

New master theme → `src/themes/<name>/Home.tsx`, register in `src/themes/registry.ts`, add a demo hotel in `src/data/`.
The dark bar on top of every demo page switches **Layout (NEST · CITY · GRAND) — each opens its demo hotel**, colour and heading font — turn it off with `NEXT_PUBLIC_THEME_SWITCHER=off`.

## HMS · Website Management
Open `/hms/website/overview` — one simple module that manages any property and any theme (6 pages). How themes plug in: [`technology/website-management.md`](technology/website-management.md).

## Shared rules (all themes)

- One theme engine, many skins: data, booking flow and routes are the same; look changes.
- **10 colour themes** per master theme; the hotel picks one in HMS → Website Management → Theme & Appearance. Contrast is checked automatically (WCAG AA).
- Phone = app (bottom tab bar, sheets), fully responsive: 360 · 390 · 430 · 834 · 1024 · 1280 · 1440, with real phone/tablet patterns (bottom sheets, sticky Book bar, ≥44px tap targets).
- Truthful UI: only payment methods the hotel has enabled; online card payment only when a gateway is approved; no fake ratings, no fake "Live" claims.
- Guest account = the BinGi Marketplace guest account (one login across bingi.app and every hotel site).
- Booking from the website becomes a normal HMS reservation (same booking ID, source = Website).

## Folders

```
plan/         what we build and why (plan, decisions)
ui-ux/        design rules, tokens, screen list, responsive rules
technology/   stack, data contract, API mapping
src/          the Next.js app
```

Plans: [`plan/`](plan/)
