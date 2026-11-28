# Booking calendar v2 (prototype, 28 Nov 2026)

Status: prototype only (src/components/hms/bookings/calendar.tsx). Not live.

Why: live calendar (hms.bingi.app/dashboard/bookings/calendar) shows every booking in the same blue,
hides in-house guests whose check-out date has passed (rooms 101-104, 206, 208, 209 looked empty),
lists 17 "Not live" draft units first, and cuts guest names to "Q.".

## What changed
1. Stay colour by state (booking status + today): In house (green), Arriving today (strong blue),
   Leaving today (amber), Checkout overdue (red, bar continues to tonight with stripes + "OVERDUE"),
   Booked (light blue), Not arrived (red dashed), On hold (amber dashed), Checked out (grey).
   Payment due = orange dot. Out of order = hatched. Needs cleaning = red dot by the room number.
2. Legend shows live counts and is a filter: tap "Checkout overdue" to dim everything else. Esc clears.
3. A guest past check-out still blocks the room until checked out (effTo = tonight). Free counts use the same rule.
4. Simple / Details switch (saved per browser). Details: price per category per night + free count,
   price in every free room-night (deal price green), due amount on bars.
5. Select and book (one guest, one stay): tap the first night, then the last night — every night between
   is included, no gaps. Tap another room to add it on the SAME dates. Tap a night inside the range = stay ends
   that night; tap before/after = move first/last night. If any picked room is not free on a night, the tray
   says "Room X is not free on <date>" and keeps the old selection. Drag across days and rooms does the same in
   one move. Tray: rooms, dates, nights, total before VAT & service → "Book N rooms · M nights" opens
   New booking with ?rooms=a,b&from&to (New booking reads `rooms`).
6. Hover card on a bar: state, room, stay, guests, source, total, paid, due.
7. Drag-to-move and drag-to-extend kept as before.

## Backend notes for live
- Calendar needs per night: unit state from the same engine as accommodations/tonight
  (overdue_checkout, ooo, draft) and per-unit price (rate-calendar quote) — one source for
  Calendar, Room board, Dashboard and New booking.
- Hide draft / not-live units by default ("Show rooms not on sale" toggle).
- New booking must accept several room numbers in one request.
