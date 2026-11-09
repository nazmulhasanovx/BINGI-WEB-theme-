# BinGi Web Themes

Hotel website themes for **BinGi Hotel Management Technology** (by NEONECY).
Every hotel on BinGi gets a public website + direct booking engine, fed by the same data it manages in BinGi HMS.

## How this repo works

`main` = the index (this README + shared plans). **Each theme lives on its own branch.**

| Branch | Theme | Plan | Status |
|---|---|---|---|
| `theme/grand` | **GRAND** — luxury hotel & resort | Ultra (Enterprise base) | In build (B0–B1) |
| `theme/city` | CITY — premium city/business hotel | Business | Planned |
| `theme/nest` | NEST — small hotel, guest house, home | Starter | Planned |

New theme → create `theme/<name>` from `main`, keep the same folder layout and the same data contract (`technology/data-contract.md`) so any theme can render any hotel.

## Shared rules (all themes)

- One theme engine, many skins: data, booking flow and routes are the same; look changes.
- **10 colour themes** per master theme; the hotel picks one in HMS → Website Management → Theme & Appearance. Contrast is checked automatically (WCAG AA).
- Fully responsive: 360 · 390 · 834 · 1024 · 1280 · 1440, with real phone/tablet patterns (bottom sheets, sticky Book bar, ≥44px tap targets).
- Truthful UI: only payment methods the hotel has enabled; online card payment only when a gateway is approved; no fake ratings, no fake "Live" claims.
- Guest account = the BinGi Marketplace guest account (one login across bingi.app and every hotel site).
- Booking from the website becomes a normal HMS reservation (same booking ID, source = Website).

## Folders (on every theme branch)

```
plan/         what we build and why (plan, decisions)
ui-ux/        design rules, tokens, screen list, responsive rules
technology/   stack, data contract, API mapping
src/          the Next.js app
```

Plans: [`plan/`](plan/)
