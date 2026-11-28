# Restaurant POS — full screen + compact layout

Status: prototype (demo data). Not in the live HMS yet.

- Restaurant & Bar header (every tab, next to New order): Full screen button; inside full screen all tabs (Overview, POS, Orders, Kitchen…) stay available. It hides the HMS sidebar, header and bottom nav; shows only the POS (logo, outlet, hotel, clock, Exit full screen). Uses the browser Fullscreen API when allowed, otherwise covers the window.
- Remembered per device (localStorage bingi.meals.pos.full) so a restaurant tablet / counter PC opens straight into it. Esc or Exit leaves it.
- Live HMS: show the button only to users with Restaurant access (role + permission + plan). No backend change.
- Compact: dish grid auto-fill min 150px (6 per row at 1440px), image 16:10, smaller steppers; table grid min 168px; order panel 340/380px with list scrolling and totals + Send pinned at the bottom.
