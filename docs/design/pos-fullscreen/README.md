# Restaurant POS — full screen + compact layout

Status: prototype (demo data). Not in the live HMS yet.

- Restaurant & Bar header (every tab, next to New order): Full screen button; inside full screen all tabs (Overview, POS, Orders, Kitchen…) stay available. It hides the HMS sidebar, header and bottom nav; shows only the POS (logo, outlet, hotel, clock, Exit full screen). Uses the browser Fullscreen API when allowed, otherwise covers the window.
- Remembered per device (localStorage bingi.meals.pos.full) so a restaurant tablet / counter PC opens straight into it. Esc or Exit leaves it.
- Live HMS: show the button only to users with Restaurant access (role + permission + plan). No backend change.
- Compact: dish grid auto-fill min 150px (6 per row at 1440px), image 16:10, smaller steppers; table grid min 168px; order panel 340/380px with list scrolling and totals + Send pinned at the bottom.

## Full screen on station screens (stations.png)
Same button and behaviour (shared component `src/components/hms/focus.tsx`, remembered per device and per module, key `bingi.full.<id>`):
- **Bookings** (all tabs: Calendar, Room board, Today…) — front desk.
- **Accommodations** — room status at a glance.
- **Housekeeping** — supervisor tablet.
- **Dashboard** — manager / office TV.
The page's own big title is hidden in full screen (class `focus-hide`); the slim top bar names the screen.

## Kitchen bell
Kitchen tab: "Sound off / Sound on for new orders" toggle (remembered per device). Plays a short chime when a new
ticket or a new round of added items reaches Queued. Browsers only allow sound after one tap on the page.

## Open decision
Kiosk lock (manager PIN to leave full screen on shared devices) is not built — needs role/permission backend.
