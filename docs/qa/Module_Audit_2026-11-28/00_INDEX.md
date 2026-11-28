# BinGi HMS — full module audit, 28 Nov 2026

Live testing server hms.bingi.app, property HTL-000001 Pan Pacific Sonargaon Dhaka, owner login.
Five agents ran in parallel (about 17–25 minutes each, 150–260 checks each). The lead re-checked the
two biggest claims at the end (future availability, Room board).
Out of scope: pricing, plans, Super Admin.

## Totals (new issues found 28 Nov)

| File | Modules | P0 | P1 | P2 | UI vs prototype (MATCH / PARTLY / NO) |
|---|---|---|---|---|---|
| A_Bookings_Guests_Chat.md | Bookings, Guests, Chat | 2 | 19 | 15 | 3 / 8 / 1 |
| B_Dashboard_Rooms_HK_Rates.md | Dashboard, Rooms, Housekeeping, Discounts & Rates | 1 | 11 | 11 | 6 / 9 / 3 |
| C_Meals_Services_Inventory.md | Restaurant & Bar, Inventory, Other Services | 2 | 14 | 11 | 6 / 7 / 6 |
| D_Money_Reports.md | Payments, Cashbox, Finance, Expenses, Billing, Reports | 3 | 28 | 20 | 9 / 14 / 10 |
| E_HR_Website_Settings_Global.md | Staff/HR, Website, Communication, Settings, Global UI | 1 | 18 | 33 | 8 / 11 / 4 |
| **Total** | 21 modules | **9** | **90** | **90** | **32 / 49 / 24** (105 screens) |

Earlier the same day: RETEST_2026-11-28_Operations.txt (retest folder) — 17 old P0 fixed.
Update since that file: NEW-BKG-P0-01 (future availability hangs) is now FIXED
(GET rooms?check_in=2026-12-10 → 200 in 1.4 s, re-checked by lead).

## The 9 P0 (fix first)

| # | ID | Module | Problem | Evidence |
|---|---|---|---|---|
| 1 | D-FIN-P0-01 | Finance | Desk cash and the hotel's own bKash count as BinGi money; Available 6,97,561.88 "ready to request as payout"; SET-2026-000001 (1,38,071.05) requested. Only Tk 69 came online (EPS). | finance/summary, ledger |
| 2 | D-FIN-P0-02 | Finance | Hotel's own subscription payment SIN-2026-000002 (Tk 5) booked as guest collection → hotel payable +295. | ledger TXN-2026-000001 |
| 3 | C-MEAL-P0-01 | Restaurant → Finance | Hotel's own restaurant cash sale books a 5% BinGi commission and no collection row; Services cash sales post nothing. | OFO-2026-000015, FO-2026-000077 |
| 4 | D-CASH-P0-01 | Cashbox | 24 Nov (2,91,871) and 25 Nov (3,03,000) boxes still open, no way to close them; close day has no carry-over / bank deposit step. | cashbox?business_date= |
| 5 | A-BKG-P0-01 | Bookings › Room board | 6 rooms with in-house overdue guests and OOO room 207 shown "Free · Ready to sell". Re-checked by lead. | Room board screen |
| 6 | A-BKG-P0-02 | Bookings › Calendar | "Left" counts differ from booking engine (Premium Deluxe tonight "4 left", API 0). | Calendar vs rooms?check_in |
| 7 | B-ROOM-P0-01 | Rooms | Price edit puts the room type into PENDING "units stay drafts" (Deluxe 101–105). | /api/rooms |
| 8 | C-INV-P0-01 | Inventory | Receiving at a new price re-prices all stock (100→120, should be weighted 110). | QA28 Sugar |
| 9 | E-COM-P0-01 | Communication → Finance | Messages charged (Comm 23.10, Finance 37.80) while free plan credits remain (951/1,000 email, 73/100 SMS). | Credits, Finance |

## Cross-module picture (does module X agree with module Y?)

| Link | Result |
|---|---|
| Bookings ↔ Payments (collected, due, methods) | MATCH |
| Booking folio maths (rooms + meals + services − discount) | MATCH |
| Desk cash (booking, food, expense) ↔ Cashbox today | MATCH |
| Reports "today collections" ↔ Cashbox | MATCH |
| Housekeeping task → room ready → availability | MATCH |
| Maintenance block → availability | MATCH (but 207 row says "Sellable", reports "Blocked 0") |
| Payments ↔ Finance | NO — Finance mixes desk cash with online money |
| Restaurant / Services ↔ Finance ledger | NO — commission on own sales, services missing |
| Cashbox day ↔ next day | NO — no close, no carry-over |
| Occupancy: Dashboard / Rooms / Bookings / Occupancy report / Rate calendar / Room board | NO — up to 7 different numbers |
| Reports expenses ↔ Operations | NO — reports include draft / pending / rejected |
| Reports outstanding / refund due ↔ Bookings | NO — 9,61,125 / 9,58,809 / 688; refund 31,200 vs 10,000 |
| Inventory GRN ↔ Expenses (supplier bill) | NO — no bill created |
| Payroll ↔ Expenses | NOT TESTED (draft only, not paid) |
| Communication cost ↔ Finance deduction | NO — 23.10 vs 37.80 |

## Biggest P1 themes
1. One availability / occupancy source for every screen (Dashboard uses legacy RESERVED status; room revenue today = sales booked today).
2. Cancelled / no-show / overpaid money: refund due missing from Payments, guest history and labels; cancelled orders keep money (WBK-077 +154); orders stay active after cancel.
3. Booking source always saved as Walk-in; no-show before arrival saved as Cancelled; check-in without ID on a dirty room.
4. Reports count draft/cancelled items; duplicate "Cash" row; "Net Cash" includes bKash; Excel money as text; PDF cannot print Bangla.
5. Staff added without login becomes an active HMS user; Easy/Full HR switch is per browser, not per plan; 216 never-expiring sessions.
6. Old 24 Nov UI items still open across Inventory, Services, Settings, global (sidebar names, currency formats, slow pages).

## Test data left on the server (all "QA28" or listed)
- Bookings: WBK-2026-000103 (QA Retest NoEmail, paid 16), WBK-104 (cancelled, refund due 31,200), WBK-105 (checked out, paid), WBK-106 (no-show).
- Expenses: EXP-2026-000015 (7,000, 500 paid), 000016 (draft), 000017 (5,200, 200 paid). Cashbox: QA28 cash in 10 / out 5; today's box closed and reopened.
- Restaurant: OFO-015, FO-077, FO-078 (cancelled), FO-080 (accepted, unpaid — cancel it), FO-074 now paid; menu item "QA28 Tea" (off).
- Inventory: "QA28 Sugar", PO-0002 / GRN-0002. Services: OSO-7BDQCLOVFB (cancelled), OSO-YNXTBMZFCC (cash 500).
- Rooms/HK/Rates: maintenance mnt_gr9ulnplz9 (resolved), task tsk_ltcnnlgz (done), coupon "QA28 coupon test" (paused).
- HR: staff "QA28 Staff One" (usr_179, active user!), its attendance, payroll draft run 1 (not paid).
- Deluxe price now 16,000 and PENDING — approve in Super Admin.
- Shared settings changed and restored: restaurant VAT/service (15/10 → 0/0), restaurant Pause (1 min), HR mode, sidebar mode, language, window size.

## Not tested overall
Bangla screens (language is property-wide), any Settings save, payroll payment, refund execution, EPS online payment, printing KOT/receipts, phone layout below 500 px, night audit, guest-side QR/chat.
