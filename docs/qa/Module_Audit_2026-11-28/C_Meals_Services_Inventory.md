# C — Meals (Restaurant & Bar), Other Services, Inventory — module audit 28 Nov 2026

Site https://hms.bingi.app (testing server), owner Md Yeapas, HTL-000001 Pan Pacific Sonargaon Dhaka, business date 28 Nov 2026, Chrome 1564 px.
Evidence = API (https://api.bingi.app/api/...) + on-screen text. Other agents worked on the same property at the same time (cashbox and order numbers moved because of them; only my own records are used for the maths).

## Summary
- Works: POS takeaway / table / room-bill orders, kitchen flow Queued→Preparing→Ready→Handover, cash payment with discount (154−14=140), Cashbox postings with order numbers, room-bill and service charges add to / come off the booking total on cancel, QR counter approval and Pause (old MEAL-P0-01/02 fixed), Inventory add item / receive / PO→GRN / transfer / reports maths, Services charge-to-booking, done, cancel.
- Worst: (1) hotel's own restaurant cash sales book a 5 % commission_receivable and no payment_collected in the Finance ledger; Services cash sales post nothing to the ledger. (2) Inventory receipt replaces unit cost (100→120, not weighted 110) — stock value wrong. (3) GRN-0002 created no supplier bill in Expenses.
- Also: old counter_pending orders hidden from Approvals by the Today filter; cancelled paid room-bill FO-068 still overpays WBK-077 by 154; Meals Reports count cancelled orders; discount price ignored and can exceed price; room bill allowed on not-checked-in bookings; table shows "Ready" with 4 open bills.
- Old issues: MEAL-P0-01/02 FIXED, MEAL-P2-10 FIXED, INV-P1-06 FIXED, SRV-P2-08 FIXED; most other P1/P2 from 24 Nov still open.
- Counts (new 28 Nov IDs): P0 x 2 | P1 x 14 | P2 x 11.

---

## 1. Meals — Restaurant & Bar

Settings read at start (GET meals/settings 200): tax_rate 0, vat_rate 0, service_charge_rate 0, require_counter_approval_for_qr_orders true, pos_approval_policy auto_accept, order_acceptance auto_accept, temporarily_paused false, stock_deduction_trigger manual, allow_negative_stock false.

### Screens & functions tested

| Screen / function | Result | Evidence |
|---|---|---|
| Overview KPIs (Today) | OK | Screen: Today orders BDT 438 / 3 orders, Collected BDT 0, Not paid BDT 438, Needs approval 0. GET meals/dashboard?date_from=2026-11-28: order_value 438, todays_orders 3, collected_amount 0, uncollected 438, awaiting_approval_orders 0. Matches. |
| Overview "food_cost" | BUG (data) | meals/dashboard stats.food_cost 3,099 for 438 of sales = cost_price of "You cant afford it" (999 on a 69 dish) x3 + 34 x3. Cost price is not checked against price. |
| POS — takeaway, pay now cash | OK | Created OFO-2026-000015 "QA28 Takeaway", QA Fried Rice 250 + Repellendus 77 = BDT 327, status accepted, payment paid Cash, paid_amount 327. Toast "Order sent to the kitchen." |
| POS — dine-in table order | OK (with UI bugs) | Created FO-2026-000077 "QA28 Table", table Hamim, 2 x 77 = 154. Busy table now offers "Running bill: Start a new order / Add to order FO-075 / Add to order FO-076". |
| POS — room service, room bill | OK | Created FO-2026-000078 room 502 / QA Guest 15 / WBK-2026-000094, 250, billing_type room_bill, payment_details settlement_source booking_folio. Booking total 180,000.00 -> 180,250.00. |
| POS — guest picker | BUG (P2) | After "Search or enter name" + Enter the dropdown ("Use 'QA28 Takeaway' as guest name") stays open, covers the cart lines, survives sending the order and switching to Room Service (two dropdowns on top of each other). Clicking the "Use ..." row does nothing (it is a plain div); only Enter works. |
| POS — room picker list | BUG (P1) | Room list = rooms with a booking for tonight, incl. CONFIRMED (not checked-in) bookings: 207 QA Guest 01 WBK-080, 105 WBK-103, 402/401 WBK-082, 204 WBK-089, 502 WBK-094 (CONFIRMED). Room bill can be posted to a guest who has not checked in. |
| POS — menu shows only available dishes | OK | QA28 Tea switched off -> not in POS menu. |
| POS — discount price | BUG (P1) | Menu "Repellendus Dolor a" price 77, discount_price 46, but POS/QR charge 77 (FO-077 lines 77 each). Discount price is stored but never used. |
| Orders list + KPIs | OK | Orders (Today) 6, Order value BDT 1,169 = 250+154+327+146x3, Collected 327, Not paid 842. After my payment/cancel: 1,405 / 467 / 938 (incl. another agent's FO-079). |
| Orders — Collect payment (cash, discount) | OK | FO-077: received 200, change 60, discount 14 "QA28 discount test" (reason becomes required). API: subtotal 154, discount_amount 14, grand_total 140, paid 140. Cashbox 31,798 -> 31,938 (+140), movement "Food Payment FO-2026-000077 +Tk. 140". |
| Collect payment drawer header | BUG (P2) | After discount, "Total Amount BDT 154.00" stays at top while Amount and Balance show 140. |
| Payment methods | BUG (P2, old MEAL-P1-06) | Still "Cash / bKash / bKash". GET meals/payment-methods: two entries both id "payment-method-1" label bKash -> that is why clicking one highlights the other. |
| Orders — Cancel (room bill, unpaid) | OK | FO-078 Review order action -> Cancel, reason "Item unavailable", confirm tick -> status cancelled; booking WBK-094 total back to 180,000.00. |
| Cancel drawer | BUG (P2, old MEAL-P2-16) | Opens on "Reject" tab with "Reject Order unavailable"; footer "Cancel" + "Cancel Order". |
| Order status flow (Kitchen) | OK | OFO-015 Queued -> Start preparing ("Preparation started.") -> Mark as ready ("Order marked as ready.") -> View handover -> Confirm handover -> API status delivered, delivered_at = served_at = completed_at 05:36 UTC. |
| Order detail timeline | BUG (P2) | Steps "Request received / Queued / Preparing / Ready" only — no Served/Delivered or Paid step. |
| Handover dialog | P2 | Dark full-screen overlay (design rule: no dark overlays). |
| Kitchen board | OK | Active 6 / Scheduled 0 / Completed 0 -> 1 after handover; timers 55–57 min correct vs 10:38 orders; "Last updated 11:34 AM" refreshes on action. |
| Approvals — QR counter approval | FIXED | Guest QR (foods/HTL-000001-2843U) order FO-2026-000080 "QA28 QR Guest" -> guest page "Awaiting confirmation"; appears in Approvals (2); "Accept & Send to Kitchen" -> accepted. |
| Approvals — old counter_pending orders | BUG (P1) | GET meals/counter-queue (no date) returns FO-073, FO-072, FO-009, FO-008 (counter_pending since 9 Sep / 24 Nov). Approvals tab sends date_from=date_to=today -> "Pending Approval 0 / No orders are waiting". Orders summary (no date) says awaiting_approval_orders 4; sidebar badge showed "Meals 4" while Approvals showed 0. Old approvals are invisible. |
| Pause accepting orders | FIXED (partly) | Settings -> Ordering -> Pause ON -> Save -> API temporarily_paused true. Guest QR: menu still shows Add buttons and no notice; on "Place Order" red banner "Restaurant ordering is temporarily paused." and no order created. Staff Overview shows "New orders are paused. Settings". Set back to OFF (API false) after ~1 min. |
| Settings save | OK (old MEAL-P0-01 fixed) | Save worked twice (pause on/off), no 422. VAT/service not changed (0/0). |
| Settings — operating hours | BUG (P2, old P2-05) | Opening 07:17 PM, Closing 06:18 PM, no check. Time zone list still offers UTC. |
| Settings — two pricing approvals | P2 | Ordering has both "Require counter approval for QR orders" (true) and backend order_acceptance auto_accept; QR now waits, so OK, but two fields for one rule. |
| Menu — list, add item | OK | Items 3 -> 4, "Menu item created successfully." |
| Menu — discount > price | BUG (P1, old MEAL-P1-02) | Added "QA28 Tea" price 50, discount 80, cost 10 -> saved (API id 18, discount_price 80). |
| Menu — availability toggle | OK | QA28 Tea off -> API is_available false, hidden in POS. |
| Menu — "Sold on" channels | P2 (old P2-08) | channels {pos, qr} only. |
| Tables & QR | BUG (P1, old MEAL-P1-04) | Table Hamim shows "Ready" while it has 4 open orders today (FO-075, 076, 077, 080). POS table card shows only FO-075. |
| Guest QR menu | P2 (old P2-11/12/13/15) | Header "Table 2843U" (code, not "Hamim"); dish page background is the burger photo behind fried rice; header uses fork-on-red "BiNGi" icon, not official logo; "Online payment — Pay securely through EPS" and big "Pay online" button on status page; "Sign in to use your saved details" red under Guest Name; summary shows both "Tax (0.00%)" and "VAT (0.00%)". |
| Reports | BUG (P1) | Today: Accepted orders BDT 1,155 (6 orders, avg 192.5) = correct; Not paid 688 = 1,155 − 467 correct. But "Sales by day 1,405" and "By channel: Staff POS 1,155 + Staff Dashboard 250 + Table QR 250 = 1,655" include the cancelled FO-078 (250) and the not-approved FO-079. Order ledger shows cancelled FO-078 with "Balance BDT 250". "1 orders" grammar still. "0 posted to rooms" while FO-078 was posted (then cancelled). |
| Cashbox tab | PARTLY | Tab leaves Restaurant & Bar and opens /dashboard/cashbox?box=meals (main cashbox, "separate_meals_cashbox": false). Shows Food Payment Tk. 717 today, my two payments listed with order numbers. Currency "Tk." vs "BDT" in Meals. |
| KOT / printing | NOT TESTED | Printing would open browser print dialog (old P1-07); not clicked. |

### Business logic checks

| Check | Expected | Actual | Result |
|---|---|---|---|
| Order total = items + VAT + service − discount | 154 + 0 + 0 − 14 = 140 | grand_total 140, paid 140 | MATCH |
| Takeaway total | 250 + 77 = 327 | 327 | MATCH |
| Cash meal payment -> Cashbox | +327 (OFO-015), +140 (FO-077) | 266 -> 593 (+327); 31,798 -> 31,938 (+140); movements carry order numbers | MATCH |
| Cash meal payment -> ledger (GET finance/ledger) | payment_collected row, no commission (founder: commission only on marketplace bookings) | OFO-015: only commission_receivable 16.35 (5 % of 327). FO-077: only commission_receivable 7.00 (5 % of 140). No payment_collected row. Older meal payments (OFO-010..013, FO-029, FO-052) have payment_collected + commission_earned 5 % + hotel_payable 95 %. | WRONG (P0) |
| Room-bill order -> booking total | +250 on order, −250 on cancel | WBK-094 180,000 -> 180,250 -> 180,000 | MATCH |
| Room-bill order -> Bill & folio line | Line in folio | Not re-checked in Bookings UI (retest 28 Nov: only note "Some order amounts are separate") | NOT TESTED here |
| Cancelled paid room-bill FO-2026-000068 (154) | Booking credit/refund 154 or money moved off | WBK-2026-000077 total 2,969.14, paid 3,123.14, "Fully Paid", status CHECKED_IN since 10 Nov. Order cancelled + payment_status paid. 154 over-collected, no refund/credit row. | WRONG (P1, still open) |
| Old counter_pending orders | Approved/cancelled, visible in Approvals | FO-073 (unpaid, WBK-100), FO-072 (partially_paid 84, WBK-079), FO-009 (unpaid, WBK-011), FO-008 (paid 77, WBK-010) still counter_pending; hidden by Today filter | WRONG (P1) |
| Orders summary (all dates) | collected = sum paid | collected_amount 1,854 = 1,770 (paid, not cancelled) + 84 (FO-072 part) ; cancelled-paid FO-068 154 excluded | MATCH |
| Stock deduction when served | trigger "manual" -> no auto deduction; menu ↔ recipe link | OFO-015 (1 x QA Fried Rice, recipe 0.2 kg QA Rice) delivered; QA Rice stayed 113.000 kg, no new movement. Recipe "QA Fried Rice" has no menu_item_id. | As set, but MEAL-P1-01 / INV-P1-07 still open |
| Reports vs Orders | same accepted value | Accepted 1,155 = Orders non-cancelled accepted; Sales-by-day 1,405 and By-channel 1,655 include cancelled/pending | WRONG (P1) |
| Overview "Needs approval" vs sidebar vs API | same number | Overview 0, Approvals 0, sidebar "Meals 4", API summary 4 (before my QR order) | WRONG (P1) |
| Pause blocks guest orders (API) | refused | refused with message | MATCH |
| QR approval | waits | waits (FO-080) | MATCH |

### UI/UX vs approved design (prototype src/components/hms/meals)

| Screen | Prototype | Live | Match |
|---|---|---|---|
| Tabs | Overview, POS, Orders, Kitchen, Menu, Tables & QR, Reports, Cashbox, Settings; approvals folded into Orders/Overview "Needs approval" | Same + separate "Approvals" tab; Cashbox jumps to main Cashbox page | PARTLY |
| Overview | KPIs, Needs approval list, paused banner | KPIs, Needs approval, Ready to serve, Kitchen now, Recent orders, paused banner | MATCH |
| POS | Service charge % and VAT % lines in cart, "Send for approval" vs "Send to kitchen", "Add items" to running bill | Running bill choice present; only Subtotal/Total shown (VAT/service lines hidden at 0 %); guest dropdown stuck | PARTLY |
| Orders | chips All / Needs approval / In kitchen / Ready / Not paid / Served / Cancelled | All / Needs approval / Queued / Preparing / Ready / Served / Cancelled / Not paid + source/type/payment filters | MATCH |
| Kitchen | oldest first, red when late | 3 columns Queued/Preparing/Ready, sort, Expand workspace | MATCH |
| Settings | 3 toggles (QR check, POS check, Pause), service % + VAT % (0–30 check) | Profile/Ordering/Charges/Kitchen/Printing/QR appearance; Tax + VAT both | PARTLY |
| Order detail | lines + service charge + VAT + Add items | lines, subtotal, collected, balance, timeline without Served | PARTLY |
| Names | "Restaurant & Bar" | Page "Restaurant & Bar", sidebar "Meals", breadcrumb "F&B" | NO (old P2-01) |

### Old issues status

| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| MEAL-P0-01 settings save 422 | NOT FIXED | FIXED (saved pause on/off) |
| MEAL-P0-02 QR ignores pause / approval | NOT FIXED | FIXED — approval waits (FO-080); pause refuses order at checkout. Menu shows no paused notice (P2). |
| MEAL-P0-03 QR order payment 500 | NOT FIXED | FIXED in retest 28 Nov (FO-074); not repeated |
| MEAL-P1-01 menu not linked to inventory | open | STILL OPEN (no stock change on served order) |
| MEAL-P1-02 discount > price | open | STILL OPEN (QA28 Tea 50 / 80) |
| MEAL-P1-03 reports stale | open | Numbers fresh after tab switch; but Sales-by-day / By-channel count cancelled — new P1 |
| MEAL-P1-04 second bill on busy table | open | PARTLY — POS now offers "Add to order"; table still "Ready" with 4 open bills |
| MEAL-P1-05 POS "Send for approval" | open | Policy is auto_accept now; button says "Send to kitchen" — not re-tested with approval |
| MEAL-P1-06 two bKash | open | STILL OPEN (duplicate id payment-method-1) |
| MEAL-P1-07 receipt opens print | open | NOT TESTED |
| MEAL-P2-01 three names | open | STILL OPEN |
| MEAL-P2-03 "1 orders" | open | STILL OPEN (Reports "1 orders · 1 cancelled") |
| MEAL-P2-05 hours / UTC | open | STILL OPEN |
| MEAL-P2-06 Tax + VAT | open | STILL OPEN (guest summary shows both) |
| MEAL-P2-10 kitchen timers frozen | open | FIXED (timers match clock) |
| MEAL-P2-11/12/13/14/15 guest QR polish | open | STILL OPEN |
| MEAL-P2-16 cancel drawer | open | STILL OPEN |
| MEAL-P2-17 demo data | open | STILL OPEN (lorem dishes, personal photo "You cant afford it", cost 999 on 69 dish) |

### Bugs

| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| C-MEAL-P0-01 | Hotel's own restaurant cash sale books 5 % BinGi commission and no collection row | POS takeaway OFO-2026-000015, cash 327; FO-077 cash 140; GET finance/ledger | payment_collected 327 / 140, no commission (commission only on marketplace bookings) | Only commission_receivable 16.35 and 7.00 (5 %). Older meal orders: commission_earned 5 % + hotel_payable 95 %. Finance balance reduced by commission on in-house sales. | BE: meal/service payments (source pos/qr/staff) -> payment_collected only, no commission rows; clean old rows. |
| C-MEAL-P1-01 | Old counter_pending orders hidden from Approvals | Approvals tab (date Today) | 4 old pending orders listed or flagged "overdue" | "No orders are waiting"; API counter-queue without date has FO-008/009/072/073; FO-008 paid but still counter_pending | FE: Approvals ignores date filter (show all pending); BE: auto-close or expire; sidebar/overview use one count. |
| C-MEAL-P1-02 | Cancelled paid room-bill order keeps the money on the booking | FO-2026-000068 (154, paid, cancelled) on WBK-2026-000077 | credit 154 or refund row | booking paid 3,123.14 on 2,969.14 bill, "Fully Paid", no credit | BE: cancelling a paid room-bill order creates folio credit / refund-due. |
| C-MEAL-P1-03 | Reports count cancelled and not-approved orders in Sales by day / By channel | Reports (Today) | 1,155 everywhere | Accepted 1,155, Sales-by-day 1,405, channels sum 1,655; ledger shows cancelled FO-078 "Balance 250" | Exclude cancelled/rejected/pending; cancelled balance 0. |
| C-MEAL-P1-04 | Menu discount price never applied; can be higher than price | Menu Repellendus 77 / discount 46; QA28 Tea 50 / 80 | Discount < price enforced; POS/QR sell at discount price (or hide field) | POS/QR charge 77; 80 > 50 accepted | FE+BE validation; use discount_price in order lines. |
| C-MEAL-P1-05 | Room bill can be posted to a booking that is not checked in | POS Room Service -> room picker | Only CHECKED_IN stays | CONFIRMED bookings offered (WBK-094 room 502 used) | Filter by in-house status. |
| C-MEAL-P1-06 | Table status ignores open bills | Tables & QR, Hamim with 4 open orders | "Occupied / 4 open bills" | "Ready"; POS card lists only FO-075 | Table status from open orders. |
| C-MEAL-P2-01 | Guest picker dropdown sticks open | POS -> Guest -> type -> Enter -> send | Closes after choice | Stays open over cart, survives order and mode switch; "Use ... as guest name" row not clickable | FE fix. |
| C-MEAL-P2-02 | Duplicate payment method id | GET meals/payment-methods | unique ids, labelled accounts | two bKash both "payment-method-1" | Unique ids; show account label/number. |
| C-MEAL-P2-03 | Collect payment header total not updated after discount | FO-077 discount 14 | Total 140 | Header "Total Amount BDT 154.00", Amount 140 | FE. |
| C-MEAL-P2-04 | Paused menu gives no notice until checkout | Pause ON, open QR menu | Banner "Not taking orders now", Add disabled | Add works; error only on Place Order | FE read pause. |
| C-MEAL-P2-05 | Order timeline has no Served/Delivered/Paid step | Order detail | full flow | stops at Ready | FE. |
| C-MEAL-P2-06 | Cost price not checked (food cost 3,099 on 438 sales) | Menu "You cant afford it" 69 / cost 999 | warning when cost > price | saved, Overview food_cost 3,099 | FE warning; clean demo data. |
| C-MEAL-P2-07 | Cashbox tab leaves the module; "Tk." vs "BDT" | Restaurant & Bar -> Cashbox | stays inside frame (prototype) | opens /dashboard/cashbox?box=meals, money in "Tk." | FE. |

---

## 2. Inventory

GET inventory 200 (items, stores, controls {approval_limit 0, po_needs_approval false}). Stores: Main Store (1), QA Kitchen (2).

### Screens & functions tested

| Screen / function | Result | Evidence |
|---|---|---|
| Stock list + KPIs | OK | Before: Active 2, Stock value BDT 11,135.00 = DENTAL 20 x 20 + QA Rice 113 x 95. After my item: 3 / 12,135.00, Low stock 1, banner "1 item to reorder". |
| Add Item (QA28 Sugar, kg, opening 10, reorder 12, cost 100) | OK | API: current_stock 10, stock {Main:10}, unit_cost 100, reorder 12. "Opening stock is in: Main Store / QA Kitchen" now shown. |
| Add Item — SKU | BUG (P2, old INV-P2-02) | No SKU -> list shows "kg" under the name; no auto SKU. |
| Add Item — units | BUG (P2, old INV-P2-01) | Units still piece, kg, litre, packet, box (no gram/ml/bottle/roll/set). Buying units carton…bundle OK. |
| Add Item — hint | P2 (old INV-P2-07) | "Enter 0 if this item has no stock yet" still under Unit Cost. |
| Receive (no PO) 10 kg @ 120, QA Fresh Supply, ref QA28-INV-1 | OK / BUG cost | Stock 10 -> 20, but unit_cost 100 -> 120 (not weighted 110). Form text still "A unit cost entered here replaces the item's current unit cost." Item pre-selected = DENTAL (old INV-P2-05). |
| Purchase order PO-0002 (5 kg @ 110) | OK | Submit -> "Approved" at once (po_needs_approval false), total BDT 550.00. |
| PO receive -> GRN | OK | Receive goods, invoice QA28-INV-2 -> PO "Received", GRN-0002 shown under "Goods received". Stock 25 kg, unit_cost 110. |
| GRN -> Expense (supplier bill) | BUG (P1) | GET operations/expenses: still 11 expenses, none with inventory_goods_receipt_id for GRN-0002. Only EXP-2026-000011 "Supplier bill GRN-0001 · QA Fresh Supply" 2,375 (inventory_goods_receipt_id 1), created 24 Nov 16:11, 4 h after GRN-0001 (12:13). PO screen has no "Create bill / Send to Accounts" button. |
| PO drawers | BUG (P1, old INV-P1-04) | New Purchase Order and Receive goods drawers: title + X hidden under top bar (only "...orders are approved and ready to receive." visible); dark backdrop. |
| PO list | P2 (old INV-P2-09) | PO-0001 "5 still due across lines" (no unit). |
| Issue form | BUG (P1, old INV-P1-02) | Issue and Wastage still show Supplier + Unit Cost + "replaces the item's current unit cost". |
| Wastage 1 kg, no reason | BUG (P1, old INV-P1-03) | Saved; API movement wastage note empty; History "-". |
| Transfer | OK | 30 kg -> "Enter 24 kg or less. That is all this store has."; 4 kg -> stock {Main 20, QA Kitchen 4}. |
| History | PARTLY (old INV-P2-12) | 6 rows, Asia/Dhaka, "history can't be edited or deleted". Balance column mixed: Main Store transfer row 20 kg (store), QA Kitchen +4 row 24 kg (property total), wastage row 24 kg. |
| Reports | OK | Estimated stock value BDT 13,775.00 = 400 + 113x95 + 24x110; by store Main 7,825 (400 + 55x95 + 20x110), QA Kitchen 5,950 (58x95 + 4x110) — correct with the current cost method; Cost of goods used today BDT 110 (1 kg wastage @110). |
| Recipes & sales | PARTLY | QA Fried Rice: QA Rice 0.2 kg, cost 19, sells 250, 7.6 % — correct maths. Recipe is free text, not linked to Meals menu (no menu_item_id); SALE-0001 is manual. |
| Stock count | NOT TESTED in depth | Page now says "Count a whole store ... then review and post the differences" (review step added vs old INV-P2-11); no new count run. |
| Low stock | OK | 10 kg <= reorder 12 -> Low stock 1; after receipts 0. |
| Breadcrumb | P2 | Stock tab breadcrumb "Dashboard"; PO tab "Dashboard > Purchase". |

### Business logic checks

| Check | Expected | Actual | Result |
|---|---|---|---|
| Weighted average on receive | (10x100 + 10x120)/20 = 110 | 120 (last price) | WRONG (P0 — stock value + food cost) |
| Stock value after receipt 1 | 2,200 | 2,400 (20 x 120) | WRONG (+200) |
| GRN creates supplier bill in Expenses | Expense 550 linked to GRN-0002 | none | WRONG (P1) |
| Transfer keeps property total | 24 | 24 (20 + 4) | MATCH |
| Wastage cost | 1 x 110 | COGS 110 | MATCH |
| Served meal deducts recipe stock | 0.2 kg QA Rice per QA Fried Rice (if trigger on served) | trigger manual, no deduction, recipe not linked to menu | OPEN (MEAL-P1-01 / INV-P1-07) |

### UI/UX vs approved design (prototype src/components/hms/inventory)

| Screen | Prototype | Live | Match |
|---|---|---|---|
| Tabs | Stock, Purchase orders, Stock count, Recipes & sales, History, Reports, Setup | same | MATCH |
| Add Item | opening store pick, auto SKU, unit list incl. bottle/roll/set | store pick yes; no auto SKU; short unit list | PARTLY |
| Receive | "Updates automatically as a weighted average" | "replaces the item's current unit cost" | NO |
| Issue / Wastage | no supplier/cost; reason required for wastage/adjust | supplier + cost shown; reason optional | NO |
| Drawers | title visible, light backdrop | PO drawers title hidden, dark backdrop | NO |
| Reports | value, low stock, movements, COGS, by store | same | MATCH |

### Old issues status

| ID | 24 Nov | 28 Nov |
|---|---|---|
| INV-P1-01 new price re-prices all stock | open | STILL OPEN (100 -> 120) |
| INV-P1-02 Issue/Wastage show cost + supplier | open | STILL OPEN |
| INV-P1-03 wastage without reason | open | STILL OPEN |
| INV-P1-04 drawer title hidden | open | STILL OPEN (PO + receive drawers) |
| INV-P1-05 buying unit ignored | open | NOT RE-TESTED (QA28 Sugar has no buy unit) |
| INV-P1-06 opening stock always Main | open | FIXED ("Opening stock is in" store pick) |
| INV-P1-07 recipes not linked to Meals | open | STILL OPEN |
| INV-P2-01 units | open | STILL OPEN |
| INV-P2-02 no SKU shows "kg" | open | STILL OPEN |
| INV-P2-05 Receive pre-selects first item | open | STILL OPEN (DENTAL) |
| INV-P2-07 hint under Unit Cost | open | STILL OPEN |
| INV-P2-09 "5 still due" no unit | open | STILL OPEN |
| INV-P2-11 stock count no review | open | PARTLY (text says review + post) — not run |
| INV-P2-12 history balance | open | STILL OPEN (mixed store/property) |
| INV-P2-14 dark drawer backdrop | open | STILL OPEN |
| INV-P2-17 BDT vs Tk. | open | STILL OPEN (Inventory BDT, Cashbox Tk.) |

### Bugs

| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| C-INV-P0-01 | Receiving at a new price re-prices all stock (no weighted average) | QA28 Sugar 10 kg @100 -> Receive 10 kg @120 | unit cost 110, value 2,200 | unit cost 120, value 2,400 | BE weighted average per receipt; movement keeps own cost. (Old INV-P1-01, raised to P0: wrong stock money.) |
| C-INV-P1-01 | GRN does not create a supplier bill / expense | PO-0002 -> Receive goods -> GRN-0002 | Expense "Supplier bill GRN-0002" 550 due (or a "Create bill" button) | no expense, no button | BE: on GRN create draft/approved expense with inventory_goods_receipt_id; FE: show bill link on PO. |
| C-INV-P1-02 | Wastage saved without reason | Wastage 1 kg, note empty | reason required | saved, note "" | FE+BE required. |
| C-INV-P1-03 | Issue/Wastage forms change cost/supplier | Issue / Wastage drawer | no cost/supplier | shown with "replaces" text | hide; BE ignore. |
| C-INV-P1-04 | PO / Receive goods drawer header hidden | New order, Receive goods | title + X visible | hidden under 63 px top bar | top offset / z-index. |
| C-INV-P2-01 | History balance mixes store and property totals | History after transfer | store balance per row | Main row 20 (store), QA Kitchen row 24 (property) | use store_balance_after. |
| C-INV-P2-02 | No auto SKU; units short; Receive pre-selects DENTAL; hint placement | Add Item / Receive | prototype | as before | FE. |

---

## 3. Other Services

GET other-services 200 (services, categories, orders, settings {service_charge_percent 0, vat_percent 0, max_discount_percent 0}, resources, vendors, staff, payment_methods, permissions).

### Screens & functions tested

| Screen / function | Result | Evidence |
|---|---|---|
| Today board | PARTLY | Columns Scheduled / Assigned / Active / Done (no "New requests" — old SRV-P1-07). Board + Timeline switch, department filter. |
| New order — charge to booking | OK | Transport 500, booking search "QA Guest 15" finds WBK-2026-000094 (old "no result" fixed), guest name + phone filled, assigned QA28 Staff One. OSO-7BDQCLOVFB created, charge_type booking. Booking total 180,000 -> 180,500. |
| Status after save (assigned, not started) | BUG (P1, old SRV-P1-01) | Card lands in "Active — open work to deliver", not "Assigned". API status active. |
| Order details buttons | BUG (P1, old SRV-P1-02) | Close / Edit Order / Mark done only; no Assign / Start. New: "Cancel this order" link. |
| Mark done | OK | API status completed, payment "unpaid" (on booking). |
| Cancel completed booking order | OK | Reason list (Guest changed plans … Other), text "The charge is removed from the guest's booking bill." -> status cancelled, cancel_reason "Wrong order", booking total back to 180,000. |
| New order — cash sale | PARTLY | Info "Cash posts to today's open Cashbox." (new). Still "Cash sale · paid now" only — no bKash/Nagad/card, no pay later (old SRV-P1-04). OSO-YNXTBMZFCC "QA28 Walkin" 500 paid; Cashbox 35,738 -> 36,238 (+500). |
| Cash sale -> ledger | BUG (P1) | GET finance/ledger: no row for OSO-YNXTBMZFCC (no payment_collected). Service cash revenue exists only in Cashbox. |
| Assign to list | P2 (old SRV-P2-05) | "Md Yeapas" twice = two users (#75, #136) with the same name; no way to tell apart. |
| Orders tab | PARTLY | "Charged to bookings BDT 29,236" = sum of non-cancelled on-booking orders (1,500+500+1,500+2,200+1,000+22,000+500+18+18) — correct. "Orders today 2 / Sales today BDT 2,000" = my cash 500 + another agent's OSO-LWOH2WNHFR (1,500, on booking, requested 5 Dec) — a future booking charge counted as today's sale (P2). |
| Old orders | P2 (old SRV-P2-13) | OSO-OUDCGWGWBL (4 Nov, 22,000), OSO-D4UHK52ZUV (4 Nov), OSO-QAXNV1IMB4 LUX (12 Nov) still "Active"; OSO-SAQRZCQHR1 (14 Nov), OSO-F2EZ9CAGQQ (26 Nov), 2 x Sept still "Scheduled" — no overdue flag. |
| Reports | OK | "Non-cancelled orders by requested date": Order value 30,218 (9 orders) = all non-cancelled minus 5 Dec order and Sept orders; Transport 5 orders BDT 24,500 = 500+1,000+22,000+500+500. Margin 29,900 = 30,218 − 318 service charge/VAT. Cancelled OSO-7BDQ excluded. |
| Catalog | BUG (P1, old SRV-P1-06) | Durations "20", "2", "1 hour" (no unit / mixed). |
| Add Service | BUG (P1/P2) | No "Charged per" / child price (old SRV-P1-05); "Horizon Experiences" website text (old SRV-P2-15); not saved. |
| Setup / Timeline / vendor cost | NOT TESTED | time. |

### Business logic checks

| Check | Expected | Actual | Result |
|---|---|---|---|
| Charge to booking adds to booking total | +500 | 180,000 -> 180,500 | MATCH |
| Cancel removes booking charge | −500 | 180,500 -> 180,000 | MATCH |
| Cash sale -> Cashbox | +500 | +500 | MATCH |
| Cash sale -> Finance ledger | payment_collected 500 | no row | WRONG (P1) |
| Charged to bookings KPI | 29,236 | 29,236 | MATCH |
| Reports by service | 24,500 Transport | 24,500 | MATCH |
| Work status rule | assigned -> "Assigned" | "Active" | WRONG (P1) |

### UI/UX vs approved design (prototype src/components/hms/services)

| Screen | Prototype | Live | Match |
|---|---|---|---|
| Tabs | Today, Service Catalog, Orders, Reports, Setup | same | MATCH |
| Today board | New requests / To assign / Assigned / In progress / Done; timeline rows per resource | Scheduled / Assigned / Active / Done | PARTLY |
| Order details | Assign, Start, Done | Mark done only | NO |
| New order | pay now (cash/bKash/Nagad/card) or later; charge to booking | cash only or booking | PARTLY |
| Add service | charged per, child price, one duration | unit price + free-text duration | NO |

### Old issues status

| ID | 24 Nov | 28 Nov |
|---|---|---|
| SRV-P1-01 scheduled/assigned -> Active | open | STILL OPEN |
| SRV-P1-02 only Mark done | open | STILL OPEN (Cancel link added) |
| SRV-P1-03 errors hidden at bottom | open | NOT RE-TESTED (no error case) |
| SRV-P1-04 cash only | open | STILL OPEN (cashbox hint added) |
| SRV-P1-05 no charged per | open | STILL OPEN |
| SRV-P1-06 durations | open | STILL OPEN |
| SRV-P1-07 no New requests | open | STILL OPEN |
| SRV-P2-05 Md Yeapas twice | open | STILL OPEN (two users #75/#136) |
| SRV-P2-08 booking search empty | open | FIXED (search by guest name works) |
| SRV-P2-10 order number OSO-XXXX | open | STILL OPEN (OSO-7BDQCLOVFB) |
| SRV-P2-12 sales today vs reports | open | STILL OPEN (now counts future booking order) |
| SRV-P2-13 old orders Active | open | STILL OPEN |
| SRV-P2-15 "Horizon Experiences" | open | STILL OPEN |
| SRV-P2-16 lorem demo data | open | STILL OPEN |

### Bugs

| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| C-SRV-P1-01 | Service cash sales never reach the Finance ledger | Cash sale OSO-YNXTBMZFCC 500 | payment_collected 500 | Cashbox +500, ledger nothing | BE post payment_collected (no commission). |
| C-SRV-P1-02 | Assigned order shown as Active | New order assigned, not started | "Assigned" column | "Active" | BE status from assignee/start. |
| C-SRV-P1-03 | No Assign / Start in details | Order details | Assign, Start, Done | Mark done only | FE. |
| C-SRV-P1-04 | Cash sale: cash only, no pay later | New order -> Cash sale | cash / bKash / Nagad / card, pay later | "Cash sale · paid now" | FE+BE. |
| C-SRV-P2-01 | "Sales today" counts a 5 Dec booking order created today | Orders tab | today's requested/collected only | 2,000 incl. 1,500 future | align with Reports rule. |
| C-SRV-P2-02 | Same-name staff in Assign list | Assign to | name + role/phone | "Md Yeapas" x2 | show extra label. |

---

## Test data created (all on HTL-000001, 28 Nov 2026)

| Module | Record | State left |
|---|---|---|
| Meals | OFO-2026-000015 "QA28 Takeaway", QA Fried Rice + Repellendus, 327 | paid cash, delivered (Cashbox +327, ledger commission_receivable 16.35) |
| Meals | FO-2026-000077 "QA28 Table", table Hamim, 2 x Repellendus | paid cash 140 (discount 14 "QA28 discount test"), still Queued in kitchen |
| Meals | FO-2026-000078 room 502 / WBK-2026-000094 QA Guest 15, note "QA28 room bill test", 250 | cancelled (booking total back to 180,000) |
| Meals | FO-2026-000080 "QA28 QR Guest" (guest QR, table Hamim), 250 | approved, accepted, unpaid, Queued — cancel or pay when cleaning |
| Meals | Menu item "QA28 Tea" (id 18) price 50 / discount 80 / cost 10 | unavailable (switched off) |
| Meals settings | Pause ON then OFF (~1 min, 11:39–11:40) | back to temporarily_paused false; VAT/service untouched (0/0) |
| Inventory | Item "QA28 Sugar" (id 10, kg, reorder 12) | 24 kg (Main 20, QA Kitchen 4), unit cost 110 |
| Inventory | Receive 10 kg @120 ref QA28-INV-1 (STM-XPZVY7L6JO) | posted |
| Inventory | PO-0002 QA Fresh Supply 5 kg @110, note "QA28 PO test", GRN-0002 invoice QA28-INV-2 | received (no expense created) |
| Inventory | Wastage 1 kg (no reason), Transfer 4 kg Main → QA Kitchen | posted |
| Services | OSO-7BDQCLOVFB Transport 500 on WBK-2026-000094, note "QA28 service folio test" | completed then cancelled ("Wrong order") |
| Services | OSO-YNXTBMZFCC Transport 500 cash sale "QA28 Walkin" | paid, Active (Cashbox +500) |

Seen but NOT mine (other agents, same time): OFO-2026-000014, FO-2026-000075/076 (146 each), FO-2026-000079 "QA28 Phone Guest" (room 301, counter_pending), OSO-LWOH2WNHFR (5 Dec, 1,500).

## Not tested (why)
- KOT print, Receipt preview, Printing / QR appearance settings — open browser print dialog (old MEAL-P1-07).
- Guest "Pay online (EPS)" — real gateway (rules).
- Collect payment on the QR order FO-080 — QR payment 500 already verified FIXED in 28 Nov retest (FO-074).
- Booking "Bill & folio" screen lines for room-bill / service orders — only booking total checked via API.
- POS approval policy "Require counter approval" (old MEAL-P1-05) — shared setting, left at auto_accept.
- Staff roles / discount above limit, phone layout, delivery, split payment, void, refund.
- Inventory: stock count run, buying units (INV-P1-05), Setup (stores/categories/suppliers), CSV/PDF export, "Send to Accounts" COGS.
- Services: Setup, Timeline, resource double-booking, vendor cost/margin, edit order, error placement (SRV-P1-03).
