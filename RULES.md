# BinGi Web Themes — rules every theme follows

Read this before building or changing a theme. Code review rejects changes that break these rules.

## 1. Structure (one repo, one `main` branch)
```
src/lib/            data contract (types), data adapter, pricing, theme engine, i18n, store
src/components/     shared engine UI: booking (search, calendar), stay (cart, checkout, bill),
                    account (OTP, My Trip, invoice), site shell (header, footer, tab bar), ui, motion
src/themes/<name>/  ONLY the look of one master theme (home sections, hero, page hero, card styles)
src/data/           demo hotels (fictional)
src/app/            routes (same for every theme)
```
Feature branches (`feature/<name>`) → review → merge to `main`. No long-lived theme branches.

## 2. Selection model (what decides a hotel's website)
| Layer | Decided by | Values |
|---|---|---|
| Master theme (layout) | Plan | Starter → NEST · Business → CITY (or NEST) · Ultra/Enterprise → GRAND (or CITY/NEST) |
| Category preset | Property type (onboarding step 1) | hotel · resort · guest-house · home · serviced-apartment · hostel · other |
| Colour + heading font | Hotel owner (HMS → Website → Theme & Appearance) | 10 colour themes · Sans/Serif |
| Content | HMS data | rooms, rates, photos, services, menu, policies, reviews |

Plan gating (`PLAN_RULES` in `src/lib/data.ts`): Restaurant/Dining and Events only on Ultra/Enterprise. A page with no data is removed from the nav.

## 3. Product rules
- Truthful UI: no fake ratings (hide under 5 reviews), no "live"/"connected" claims, packages hidden until live, online card only when the gateway is approved.
- Booking status and payment status are always shown separately.
- Payments = only methods the hotel enabled (pay at property · bKash/Nagad manual + TrxID · 30% advance · card when approved). Prices in BDT.
- One discount per booking (best of automatic offer / promo code). Service charge first, then VAT on (rate + SC).
- Extras always belong to a stay. Server re-prices every booking.
- Guest account = BinGi Marketplace account (phone OTP).

## 4. UI rules
- Phone = app: bottom tab bar (Home · Rooms · Book · Explore · My Trip), 58px header, large titles, swipe rows, sheets; tab bar hidden in the booking flow.
- Breakpoints tested: 360 · 390 · 430 · 834 · 1024 · 1280 · 1440. No horizontal overflow. Tap targets ≥ 44px on phone.
- Colours only through tokens (`--brand`, `--action`, `--brand-soft`…); never hard-code a brand colour. `--action` must keep white text ≥ 4.5:1.
- Light scrims only, no dark overlays on photos. Respect `prefers-reduced-motion`.
- Short copy: title + one fact line. No filler subtitles, no links to pages that don't exist.
- EN / বাংলা for all UI labels (`src/lib/i18n.tsx`).

## 5. Definition of done for a theme / change
`npx eslint src` clean · `npx next build` passes · full booking flow on phone and desktop · Lighthouse a11y/SEO/best-practices 100 · screenshots at 390 and 1440 attached to the PR.
