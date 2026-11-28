# Restaurant seats & QR types (prototype, 28 Nov 2026)

Status: prototype only. Not live.

Problem (live): one open order marks the whole table busy; a 4-seat table with 1 guest cannot take a second order.

## Seats
- Every seated place has seat codes: 1S, 2S … (or custom codes, e.g. B1–B6 for the bar).
- An order stores `seats[]`. Only those seats are blocked; free seats stay open for another order.
- POS Tables: each card shows the seat chips (green = free, red = taken), "x of y free", and every open order on it
  with its seats ("1S · RB-5151 · ৳3,365") — tap the order to add dishes, tap the table to order on free seats.
- New order (dine-in): table list shows free seats; seat picker (multi-select, "All free seats"); an order needs ≥ 1 seat.
- Bill / KOT / order lists show "T1 · 2S".
- Older orders with no seats count as the whole table.

## Place types (Tables & QR)
| Type | Seats | Sharing |
|---|---|---|
| Public table | yes | shared (switch "Share the table" off = whole table) |
| Private / VIP table | yes | whole table only |
| Bar counter | yes (B1…) | one guest per seat |
| Event / banquet | yes | shared or whole |
| Room QR | no | bill goes to the room |
| Other spot (pool, lobby, garden) | no | — |
QR link carries the type (`&type=`). On a shared table the guest picks their seat on the QR menu.

## Live needs
- `dining_places`: type, seat_count, seat_codes[], shared.
- `fb_orders`: seats[]; availability = seats of open orders per place; a private place blocks all seats.
- Guest QR menu: seat picker for shared tables; staff can move seats on an open order.
