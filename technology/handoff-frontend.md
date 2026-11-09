# GRAND — Frontend handoff (short)

## What is done (preview build, demo data)
All 17 routes from the plan, responsive 360 → 1440, 10 colour themes, EN / বাংলা UI toggle.
Lighthouse (home, mobile, local prod build): Performance 89 · Accessibility 100 · Best practices 100 · SEO 100.

| Route | File |
|---|---|
| `/hotel/[slug]` Home | `app/hotel/[slug]/page.tsx` |
| `/rooms`, `/rooms/[room]` | `app/hotel/[slug]/rooms/…` · `components/rooms/*` |
| `/stay` → `/checkout` → `/confirmation?id=` | `components/stay/*` |
| `/dining`, `/experiences`, `/offers` | `components/explore/*` |
| `/explore`, `/events`, `/policies` | `app/hotel/[slug]/…` |
| `/my-trip` | `components/account/MyTrip.tsx` |
| 404 / site paused | `app/hotel/[slug]/not-found.tsx` · `components/site/SitePaused.tsx` (`status: "paused"`) |
| Theme Lab | `/theme-lab` |

## To make it production
1. **Data**: replace `src/lib/data.ts` (getHotel) with the HMS public API. Keep the `Hotel` type (`src/lib/types.ts`) as the contract.
2. **Availability & price**: replace `unitsLeft()` / `nightlyRate()` in `src/lib/pricing.ts` with the booking-engine availability endpoint. Keep `quote()` for display only; **the server must re-price** on create booking.
3. **Booking**: in `components/stay/Checkout.tsx → confirm()`, call `POST /bookings` instead of `addBooking()`; use the returned booking ID.
4. **Auth**: replace the demo OTP in `components/account/PhoneOtp.tsx` with the Marketplace OTP API; session = Marketplace guest token.
5. **My Trip**: load bookings/orders/invoices from the API instead of `src/lib/store.ts` (keep the cart in the browser).
6. **Table request / events enquiry**: wire `DiningMenu.tsx → TableRequest` and `EventEnquiry.tsx` to their endpoints (remove the "Preview build" notes).
7. **Theme**: read `theme.id` + `theme.heading` from the hotel; remove the `?theme=` preview helper in production (`ThemePreview`).
8. **Domains**: resolve hotel by host for custom domains (Next `proxy`), slug for `bingi.app/hotel/<slug>`.
9. **Photos**: real hotel uploads; remove `public/demo/`.

## Rules kept in code (don't break)
- Booking status and payment status are separate everywhere.
- Payment options = only methods the hotel enabled; card shows only when `gatewayApproved`.
- Reviews hidden under 5; packages hidden unless `flags.packages`; empty pages leave the nav.
- Extras always belong to a stay (no cart without a room).
- `--action` is auto-darkened (≥5.2:1 on white) so text and buttons pass AA on every theme.
