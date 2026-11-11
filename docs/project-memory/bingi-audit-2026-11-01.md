# Live audit, 1 Nov 2026 (146 points)

Full reports are in claude.ai project docs `claude/HMS-Audit-and-UI-Plan-2026-11-01.md` and `claude/BinGi-Issue-List-by-Platform-2026-11-01.md`.
A second round on 3 Nov 2026 (BUG-01…20, UX-01…24) is in `claude/qa/BinGi_QA_Report_2026-11-03.md`.

## P0 items (19)
| Area | Problem → fix |
|---|---|
| Dates | Dates and timezone shift (bookings, Super Admin billing, HK card) → store and read in the property timezone. |
| Errors | Silent API failures (bookings 422, rooms 422, checkout 409) → a global error message. |
| Plans | Entitlement default "Enable all" → plan modules. |
| Pricing | 3 pricing sources → Super Admin versioned pricing is the single source. |
| Pricing | Room package quota not synced. |
| Trial | Trial and KYC: trial opens everything; KYC wall → the trial is plan-locked; KYC gates only online payment and public listing. |
| Billing | Orphan invoice after a failed payment. |
| Onboarding | 3 step systems and repeated data. |
| KYC | KYC freezes the whole trial. |
| Shell | Sidebar 21–23 items, the same for every plan. |
| Bookings | Guest-mode default "Existing" causes a silent 422. |
| Bookings | Checkout with money due causes a silent 409. |
| Rooms | Rooms need Super Admin approval but the HMS never says so. |
| Website | A site that was never published cannot be published. |
| Website | The site is live while the HMS says "Not published". |
| Marketplace | A cash-only hotel can't be booked. |
| Payments | Gateway domain mismatch. |
| Super Admin | Icon-only sidebar. |
| Super Admin | Modules default "Enable all". |
| Public site | Prices differ from the HMS. |

## Other themes
- **P1:**
  - Currency format ×4.
  - Raw enum/debug labels.
  - Room ID shown as the main label.
  - Duplicates (Billing ×2, Guest payments ×3).
  - A floating "Pending Activity" widget.
  - Cashbox counts the opening float as collected.
  - "Operations" holds expenses (wrong name).
- **KEEP:**
  - Settings grouped navigation pattern.
  - Bookings Easy/Detailed, tabs, wizard + summary, invoice PDF, calendar, room board.
  - Chat real-time.
  - Housekeeping auto task on checkout.
  - Menu → POS → Kitchen works.
  - Reports otherwise good.
  - Website Online Controls and checklist.

## Untested (needs the user)
Mobile HMS, Guest app, staff-role login, gateway sandbox, SMS/email delivery, OTA, Super Admin login-as.
