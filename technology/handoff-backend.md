# GRAND — Backend handoff (short)

Public, read-mostly API for hotel websites. Verify which already exist in HMS; build the missing ones.

| # | Endpoint (suggested) | Returns / does | HMS source | Status |
|---|---|---|---|---|
| 1 | `GET /public/hotels/{slug}` (or by host) | profile, address, check-in/out, branding `{logo, themeId, heading}`, `status: live/paused`, plan, flags | Settings, Website Mgmt | exists partly — add `themeId`, `heading` |
| 2 | `GET /public/hotels/{slug}/rooms` | approved categories: photos, bed, size, view, amenities, max guests, from price | Rooms | exists (approved only) |
| 3 | `GET /public/hotels/{slug}/availability?in&out&adults&children` | per category: units left, nightly rates, rate plans | Rates & Inventory | verify |
| 4 | `GET /public/hotels/{slug}/services` | extras that can be added to a stay | Other Services | verify |
| 5 | `GET /public/hotels/{slug}/dining` | outlets, hours, menu items, tags | Meals (live) | endpoint to confirm |
| 6 | `GET /public/hotels/{slug}/offers` | active discounts + rules (min nights, weekday) | Discounts | exists |
| 7 | `GET /public/hotels/{slug}/reviews` | score, count, latest approved | Guests → Reviews | exists |
| 8 | `GET /public/hotels/{slug}/policies` + payment methods + taxes | cancellation, children, pets, VAT/SC, inclusive flag, enabled payment methods | Settings | exists |
| 9 | `POST /public/hotels/{slug}/bookings` | **re-prices on server**, creates reservation (source = Website), returns `WBK-…` ID, booking status `pending`, payment status | Reservations | exists — confirm payload |
| 10 | `POST /public/auth/otp` / `verify` | Marketplace guest account (same as bingi.app) | Marketplace | exists |
| 11 | `GET /me/bookings`, `/me/orders`, `/me/invoices` | for My Trip | Reservations, Meals, Finance | verify |
| 12 | `POST /me/bookings/{id}/cancel` | applies cancellation policy | Reservations | verify |
| 13 | `POST /public/hotels/{slug}/table-requests` | to restaurant | Meals | to build / confirm |
| 14 | `POST /public/hotels/{slug}/event-enquiries` | to Events (Ultra) | Events | planned |

Rules
- Booking status and payment status are separate fields; bKash/Nagad manual payments arrive as `payment-submitted` with transaction ID and are verified by staff.
- Never trust client prices; apply one best offer (not combinable), service charge, then VAT on (rate + SC) per the country pack.
- Only approved rooms are public. A paused website returns `status: paused` (the site shows contact options).
- Rate-limit OTP and booking endpoints.
