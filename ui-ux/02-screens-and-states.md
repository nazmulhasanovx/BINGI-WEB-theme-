# GRAND — screens and states (built)

| Screen | Phone pattern | States |
|---|---|---|
| Home | hero text on photo, search pill → sheet, swipe rows, sticky Book bar | facts hide when data missing |
| Rooms | stay summary chip, type chips, 1-col cards | no dates ("from" price + hint), unavailable (dimmed, last), only-N-left |
| Room detail | swipe gallery + full-screen viewer, sticky Reserve bar | no dates, doesn't fit guests, sold out |
| Stay cart | extras with steppers, sticky total bar | empty (no room yet), offer applied |
| Checkout | summary first (collapsible), 3 sections, sticky Book bar | validation per field, OTP steps, transaction ID when bKash |
| Confirmation | reference card, two status chips | not found on device |
| Dining | outlet cards, menu chips, table request sheet | request sent |
| Experiences | category chips, Add to stay | no room yet → opens dates + toast |
| Offers | offer cards | packages hidden until live |
| Explore | sticky scroll-spy tabs | — |
| Events | enquiry form | sent, validation |
| Policies | sticky tabs | — |
| My Trip | sign-in (OTP), tab chips | empty bookings/orders/invoices, cancel (free / charged) |
| 404 · Site paused | — | — |
| Loading | skeletons for every client page | — |

Language: EN / বাংলা toggle in the top bar (desktop) and menu (phone/tablet). Covers site chrome; hotel content language comes from HMS.

## Phone = app feel (9 Nov 2026 — 70% of guests open hotel sites on a phone)
- Bottom tab bar: Home · Rooms · [Book] · Explore · My Trip (centre Book button opens the date + price calendar). Hidden inside the booking flow (room, stay, checkout, confirmation), where each page has its own solid action bar.
- Compact 58px header: logo + theme button (preview only) + menu. No top info bar.
- Home: rounded photo card with rating / type chips → title → search pill → 4 quick tiles (Rooms, Dining, Experiences, Offers) → swipe rows.
- Inner pages: iOS-style large title, no photo banner on phone.
- Rooms list: compact horizontal cards (photo left), sticky stay summary under the header.
- Footer on phone: brand + contact + BinGi credit only (navigation lives in the tab bar).
- Tap feedback (scale), no grey tap highlight, overscroll contained.
