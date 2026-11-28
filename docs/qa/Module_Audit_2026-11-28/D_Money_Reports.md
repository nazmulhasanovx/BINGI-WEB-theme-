# D Money & Reports — module audit 28 Nov 2026

Tester: QA agent group D. Site https://hms.bingi.app (testing server), property HTL-000001 Pan Pacific Sonargaon Dhaka, owner Md Yeapas (user 75). Business date 28 Nov 2026. Desktop Chrome 1568 px.
Evidence = API (api.bingi.app/api/...) + on-screen text. Prototype = /home/claude/bingi-web-theme-/src/components/hms/{payments,cashbox,finance,expenses,reports}.

## Summary
- WORKS: every desk cash payment (booking, food, expense) posts to Cashbox once and today's drawer adds up (598 → 35,738, Master Sales Cashbox In/Out match); expense approval guard, reject/draft/delete-after-pay blocks (all 422) and instant panel refresh are fixed; Payments "Total collected / Balance due / To collect" match the bookings API; first ever day close worked (Matched, Closed days row); Finance settlement SET-000001 arithmetic is internally correct.
- WORST: (1) Finance still treats 835K of desk cash + own-bKash (EPS = only Tk 69) as BinGi money – Available 697,561.88 "ready to request as payout" and SET-2026-000001 138,071.05 requested; (2) hotel payable +295 because the hotel's own subscription invoice SIN-2026-000002 (Tk 5) is booked as a guest collection; (3) 24 Nov (291,871) and 25 Nov (303,000) cashboxes are still open with no way to close them, and close has no float/carry-over step.
- Reports disagree with each other and with modules: expenses include draft/pending/rejected (today 18,200 vs 700 really paid; month 48,674 / 48,774 vs Operations 36,575), duplicate "Cash 1,518" row, Net Cash includes bKash, Payment report "Refund due 31,200", outstanding 961,125 / 958,809 / 688, occupancy 3 vs 86% vs 8 in house.
- Payments KPIs: "Total Revenue Tk 1897K" confirmed to include 10 cancelled bookings (239,048); rows are bookings not payments; Print freezes the tab; dates in To-collect are UTC (one day early). Reopening a closed cashbox erases the closed-day record; counted cash is pre-filled.
- Counts (new IDs in this file): P0 x 3 | P1 x 28 | P2 x 20.  Exports: Payments CSV, Finance CSV/PDF, Reports Excel/PDF all download (no BOM, money as text in Excel, PDFs 0.9–1 MB DejaVu only).

---

## 1. Payments (/dashboard/payments)

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Page load, KPIs | OK (loads) | "Total Revenue Tk. 1897K · 50 bookings", "Total collected Tk. 834K · 29 with a payment", "Balance due Tk. 834K", "Average Transaction Tk. 28,773.384" |
| Period chips All / Today / 7 / 30 / 90 days | OK, but basis = booking CREATED date | Today → Revenue Tk. 16, 1 booking (WBK-2026-000103 created today). Payments taken today on older bookings would not show. |
| Revenue Trend chart | BUG (P2) | Chart title stays "Revenue Tk. 1897K · Collected Tk. 834K" when "Today" is selected – chart ignores the period chip. |
| By method card | OK | Cash 539,337.14 / bKash 295,027 / EPS Gateway 64 = 834,428.14 (= sum of booking amount_paid from GET bookings) |
| Transactions tab | BUG (P1) | 50 rows = one row per BOOKING (PAY-2026-000xxx per booking), not per payment. Unpaid bookings still show method "Cash" on screen (QA Guest 14/15/16/17/20 "Cash — Unpaid"), while Jon/Rafiul show "—". |
| Filters: search, method, status | OK (lists present: All methods / Cash / EPS Gateway / bKash; All statuses / Fully / Partial / Unpaid). No Source filter (rooms / restaurant / services) and no Type filter (payment / refund / deposit) as in prototype. | screen text |
| To collect tab (20) | OK numbers, BUG dates | 20 rows, sum 834,009 = live (non-cancelled) total − paid from bookings API (834,009). MATCH. Dates printed in UTC: QA Guest 15 WBK-094 shown "2026-11-27 to 2026-11-30", API check_in 2026-11-27T18:00Z = 28 Nov Dhaka → every date one day early, raw ISO format. |
| Refunds due tab (1) | OK list / BUG flow | REF-2026-000001 · WBK-2026-000092 · Tk. 10,000.00 · Requested. Text "BinGi reviews and processes each request." – cash refund of a desk payment still waits for BinGi (MON-P1-06 open). |
| Export Report | OK (downloads) | payments-2026-11-28.csv, text/csv 5,956 bytes, 51 lines. Money now numeric (16, 20000), unpaid method "—". Still NO UTF-8 BOM; still one row per booking. |
| Print | BUG (P1) | Click Print → native print dialog, tab renderer froze (CDP timeout 45 s), Escape did not recover; tab had to be closed. Same as DOC-P1-11. |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Total Revenue basis | Live bookings only (exclude CANCELLED) | 1,897,331.14 = all 50 bookings incl. 10 CANCELLED (239,048). Live = 1,658,283.14 | WRONG (P1) – confirmed |
| Total collected vs bookings API | = Σ amount_paid | 834,428.14 (Cash 539,337.14 + bKash 295,027 + EPS 64) | MATCH |
| Collected includes cancelled-booking money | Shown separately as "refund due" | WBK-2026-000092 CANCELLED, paid 10,000, inside "Total collected"; refund REF-000001 requested but not deducted | PARTLY (refund visible, not netted) |
| Balance due | Σ (total − paid) for live bookings | 834,009 (20 bookings) = To collect list sum 834,009 | MATCH |
| Average transaction | 834,428.14 / 29 | 28,773.384 shown (3 decimals) | MATH OK, FORMAT BUG (P2, MON-P2-01 still open) |
| Overpaid booking → refund due | WBK-2026-000077 paid 154 over total (CHECKED_IN) appears in Refunds due / credit | Not listed; only REF-000001 | WRONG (P1, MON-P1-04 still open) |
| Meal / service payments | Payments page covers all guest money (prototype has Source filter) | Booking payments only; Finance collected 835,552.14 vs Payments 834,428.14 (≈1,124 meals/services missing here) | PARTLY |

### UI/UX vs approved design
| Screen | Prototype | Live | Match |
|---|---|---|---|
| KPI row | Collected · Refunded · Net received · Balance due | Total Revenue (booked value incl. cancelled) · Total collected · Balance due · Average Transaction | NO |
| Rows | One row per payment/refund/deposit with source + type, click → receipt sheet (Open booking / receipt print) | One row per booking | NO |
| Tabs | Transactions / To collect / Refunds due | same 3 tabs with counts | MATCH |
| Filters | Search, Source, Method, Type | Search, Method, Status | PARTLY |
| Chart | Net received per day for selected period | Revenue vs Collected monthly, ignores period | PARTLY |
| Currency | ৳ / tk() whole numbers | "Tk. 1897K", "Tk. 28,773.384", "Tk. 10,000.00" mixed formats | NO |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| MON-P2-01 Average 3 decimals | open | STILL OPEN (28,773.384) |
| MON-P2-03 Unpaid shows "Cash" | open | PARTLY – CSV fixed ("—"), screen still "Cash" on QA Guest 14-17, 20 |
| MON-P1-04 Overpaid / refund due hidden | open | STILL OPEN (WBK-077 +154) |
| MON-P1-06 Refund ends at BinGi | open | STILL OPEN ("BinGi reviews and processes each request") |
| DOC-P1-11 Print freezes tab | open | STILL OPEN |
| DOC-P1-13 CSV no BOM / per booking | open | PARTLY – numbers numeric now, no BOM, per booking |
| Retest C1 Total Revenue counts cancelled | new 28 Nov | CONFIRMED (239,048 cancelled inside 1,897,331.14) |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| D-PAY-P1-01 | Total Revenue counts cancelled bookings | Payments > All | Revenue of live bookings (1,658,283) or rename | Tk. 1897K incl. 10 cancelled (239,048) | BE: status != CANCELLED; or follow prototype KPIs (Collected / Refunded / Net received) |
| D-PAY-P1-02 | Transactions are bookings, not payments | Transactions tab / CSV | One row per payment (WBK-091 had 4 payments) | One row per booking, one TXN id | Use payment ledger as row source |
| D-PAY-P1-03 | Print freezes the tab | Click Print | Preview → print | Native dialog, renderer frozen, tab closed | Open preview page / print in new window |
| D-PAY-P1-04 | To-collect dates one day early (UTC) | To collect tab | 28 Nov – 1 Dec (Dhaka) | "2026-11-27 to 2026-11-30" | Format in property TZ (Asia/Dhaka), DD MMM |
| D-PAY-P1-05 | Overpaid 154 (WBK-077) not in Refunds due | Refunds due | Credit / refund line | missing | Create refund-due when paid > total |
| D-PAY-P2-01 | Average Tk. 28,773.384 | KPI | Tk. 28,773 | 3 decimals | round |
| D-PAY-P2-02 | Unpaid rows show "Cash" | Transactions | "—" | "Cash" (QA Guest 14,15,16,17,20) | show method only when paid |
| D-PAY-P2-03 | Chart ignores period chip | Today | Chart for today/period | still 1897K/834K | pass period |
| D-PAY-P2-04 | CSV without BOM | Export | UTF-8 BOM | none | prepend ﻿ |

---

## 2. Cashbox (/dashboard/cashbox, /movements, /days)

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Today (open box) | OK | "Main Cashbox is open for 2026-11-28 · opened 11/28/2026, 10:44:16 AM"; expected Tk. 593.00 at start (GET cashbox?business_date=2026-11-28&box=main → CB-2026-000022 open, opening_balance 0, current 593) |
| Where cash came from / went | OK, labels weak | Food Payment 577, Float Top Up 500, Room Payment 16 / Other 500. The 500 out is EXP-2026-000015 shown as "Expense Adjustment · Other" – not the expense category or "Expense". |
| Cash in QA28 Tk 10 | OK | Drawer 593 → 603; row "Cash In · Float Top Up · CB-2026-000022 +Tk. 10.00". "Received from: QA28 Tester" and note are NOT shown in the row (reference = cashbox id). |
| Cash out QA28 Tk 5 (Owner withdrawal) | OK | 603 → 598; "Withdrawal · Owner Withdrawal −Tk. 5.00"; "Where cash went: Owner Withdrawal 5.00" |
| Cash out over drawer (100,000) | NOT TESTED | the tool's safety layer refused that click; cash-expense > drawer → 409 was confirmed in the 28 Nov retest |
| Movements tab | OK / gap | Search + All / Cash in / Cash out + 4 totals; shows only today. No business-day picker (prototype has "Business day" select) → old days' movements can't be seen in UI (API cashbox/21/movements works). "Reverse" only on manual cash-in/out rows – good. |
| Closed days tab | BUG (P0, known) | "No closed days yet"; GET cashbox/days → data [] . API pagination links use http:// (mixed-content risk, P2). |
| Settings (view only) | PARTLY | Only one option "Separate Meals cashbox" (off). No opening-float rule, discrepancy limit or who may close. Not changed. |
| Close day (close-preview) | see section 2b | GET cashbox/22/close-preview → expected 593 (before my test), checks: unpaid_departures 11 (blocking: true), pending_refunds 1, open_food_orders 8, open_maintenance 1 |
| Page header | BUG (P2) | Top bar breadcrumb says "Dashboard" while on Cashbox |
| Dates | BUG (P2) | US format "11/28/2026, 11:33:53 AM" and ISO "2026-11-28" on the same screen |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Today's movements add up | 500 + 250 + 16 + 327 + 10 − 500 − 5 = 598 | 598.00 | MATCH |
| Booking cash → Cashbox | WBK-2026-000103 cash 16 posts | +16 Room Payment | MATCH |
| Meal cash → Cashbox | FO-074 250, OFO-015 327 | both posted | MATCH |
| Opening float card | Float = cash counted at last close / float added at opening | "Opening float Tk. 0.00" but a 500 "Float Top Up" was added 9 s after opening; card label "Cash in (includes float)" contradicts float 0 | WRONG (P1) |
| Old days still open | Only one open day; new day opens with last counted cash | 24 Nov CB-2026-000020 OPEN, balance 291,871 (opened 24 Nov 12:18); 25 Nov CB-2026-000021 OPEN, opening 105,000, balance 303,000; 26 + 27 Nov no box; 28 Nov opened at 0. Total stranded in open old boxes = 594,871 | WRONG (P0, NEW-CASH-P0-01 still open – and it is TWO old boxes, not one) |
| 25 Nov opening vs 24 Nov | 25 Nov opening = 24 Nov counted close | 105,000 vs 291,871 (24 Nov never closed) | WRONG |
| Old open day blocks anything | Opening a new day should be blocked until old day closed | Today's box opened freely; cash today limited to today's box (expense > drawer → 409, retest) | WRONG (no block, but cash blocked) |
| Expense cash out | One movement per cash payment | EXP-2026-000015 −500 once | MATCH (MON-P0-03 fixed) |

### UI/UX vs approved design
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Tabs | Today · Movements · Closed days (+ Cash settings in Meals) | same 3 + Settings button | MATCH |
| Today cards | Opening float · Cash in today · Cash out today + Where came from / went | same layout | MATCH |
| Cash in sheet | Amount (৳), "From" chips, Reference with booking datalist, Note required for Other | Amount, Reason select (5 options), Received from, Reference, Note | PARTLY |
| Cash out sheet | Reason chips (owner / bank / petty with category / refund / handover), required party/note rules | Reason select (Owner withdrawal / Bank deposit / Cash transfer / Petty cash), Recipient, Destination, Reference, Note; no petty category | PARTLY |
| Movements | Business-day select + search + direction | no day select | PARTLY |
| Close day | Count notes or total, difference reason required, "Kept for tomorrow" float, rest → main / bank | see 2b | — |
| Row text | label · category, party · note, "Auto-posted" badge | Activity + raw source label, no party/note, no auto badge | PARTLY |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| MON-P0-03 Cashbox vs expenses | PARTLY | FIXED (EXP-015 −500 once) |
| NEW-CASH-P0-01 never closes / carry-over | NEW 28 Nov | STILL OPEN – 24 Nov and 25 Nov boxes both open (594,871) |
| DOC-P1-12 no Cashbox day report / export | open | STILL OPEN – no export / print on any Cashbox tab |


### 2b. Close day test (today's box CB-2026-000022, done at 11:48 near end of session)
| Step | Result | Evidence |
|---|---|---|
| Open "Close day" | OK | Sheet "Close and reconcile · Expected in the drawer: Tk. 35,738.00"; checks: Unpaid arrivals or departures 11 · Pending refunds 1 · Open food orders 10 · Open maintenance issues 1 |
| Counted field | BUG (P1) | Counted box is PRE-FILLED with the expected amount (35738.00) → a cashier can close without counting ("blind count" missing) |
| Discrepancy flow | OK | Counted 35,700 → "Difference Tk. -38.00"; Close button disabled until "Variance reason" (and "Reason to close with unpaid bookings") are filled. Not submitted with a variance (no fake shortage on shared data). |
| Close with counted = expected | OK | Counted 35,738 + unpaid reason "QA28 test close…" → "Main Cashbox is closed for 2026-11-28 · closed 11/28/2026, 11:48:37 AM · Reconciliation complete · Expected 35,738.00 · Counted 35,738.00 · Variance 0.00". API: status closed, expected/counted 35,738, discrepancy 0 |
| Closed days | OK (first ever) | "2026-11-28 · Matched · In Tk. 36,443.00 · Out Tk. 705.00 · 11 entries · Counted Tk. 35,738.00 · closed by Md Yeapas"; GET cashbox/days → 1 row |
| Next opening float | GAP (P0 with D-CASH-P0-01) | Close sheet has no "Kept for tomorrow / deposit to bank" step (prototype has both). GET cashbox?business_date=2026-11-29 → cashbox null, status not_open, balance 0. No carry-over is planned; based on 25 → 28 Nov the next box opens at 0. Not verifiable today (future date). |
| Old open days | BUG (P0) | 24 Nov (291,871) and 25 Nov (303,000) boxes still open; nothing in the UI lets you reach or close them; closing today did not warn about them. |
| Reopen (to unblock other testers) | BUG (P1) | Reason "QA28 reopen so other testers can keep taking cash today" → box open again at 35,738. Then GET cashbox/days → 0 rows and counted_closing_balance null, although the screen promises "The prior closing record remains in audit history". Closed-day record disappears from Closed days. |
| State left | open | CB-2026-000022 OPEN, balance 35,738 (so other agents can keep taking cash). Lead may close it at the real end of day. |

| ID | What | Expected | Actual | Fix idea |
|---|---|---|---|---|
| D-CASH-P1-04 | Counted cash pre-filled with expected | empty field, staff must count | 35738.00 pre-filled | blind count |
| D-CASH-P1-05 | Reopen erases the closed record | closed record kept, new close = version 2 | Closed days empty, counted null | keep close history rows |
| D-CASH-P1-06 | No float / deposit step at close | "Kept for tomorrow" + rest to bank/owner | none | add step; next opening = kept float |

### Bugs (Cashbox)
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| D-CASH-P0-01 | Two old days still open, 5.9 lakh cash invisible | GET cashbox?business_date=2026-11-24 / -25 | Each day closed + counted; today opens with last count | CB-020 open 291,871; CB-021 open 303,000; today opened 0 | Block opening while an older day is open; force "close old day" flow; float = last counted close |
| D-CASH-P1-01 | Opening float shows 0 while 500 float added | Today card | Opening float 500 (or 0 + "Float added 500") | "Opening float Tk. 0.00" + "Float Top Up 500" in cash in | Treat float top-up at opening as float |
| D-CASH-P1-02 | Movements only for today | Movements tab | Business-day picker | none | add day select (prototype) |
| D-CASH-P1-03 | Expense cash out labelled "Expense Adjustment · Other" | Today / Movements | "Expense · <category> · EXP-…" | "Expense Adjustment / Other" | map source + category |
| D-CASH-P2-01 | Party / note not shown | Cash in QA28 | "QA28 Tester · QA28 cash in test" in row | only CB id | show party/note |
| D-CASH-P2-02 | Breadcrumb "Dashboard" on Cashbox | top bar | "Cashbox" | "Dashboard" | route title map |
| D-CASH-P2-03 | US date format | all rows | 28 Nov 2026, 11:33 | 11/28/2026, 11:33:53 AM | property locale |
| D-CASH-P2-04 | cashbox/days pagination uses http:// | API | https | http://api.bingi.app/... | APP_URL / trusted proxies |

---

## 3. Finance (/dashboard/finance)

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Overview | loads | Available Tk. 697,561.88 · pending settlement 138,071.05 · Collected 835,552.14 · Commission 146.03 · Gateway 1.73 · SMS 37.60 · Refunded 0.00 · Hotel payable 835,699.38 · Settled 0.00 (GET finance/summary 200) |
| Ledger | OK | 292 rows (GET finance/ledger), type filter list has no "Commission receivable" type although 2 rows of it today; row label raw lowercase "commission receivable"; help text "Check source/reference for the related booking…" repeated on every row |
| Payouts | OK view | Form: Tk. 697,561.88 available, period 01/11/2026 – 30/11/2026 (future end date), Send to "bKash – Yeapas (…)" . List: SET-2026-000001 Tk. 138,071.05 Requested, "SMS & email cost adjusted: Tk. 18.90", Cancel request. Request payout NOT clicked. |
| Deep link ?tab=payouts | BUG (P2) | /dashboard/finance?tab=payouts shows Overview and tabs stop responding; real key is ?tab=settlements |
| Statement (Nov 2026) | numbers off | Collected 797,088.14 · Hotel payable 796,951.78 · Deductions 159.66 (commission 136.36 + SMS 23.30) · Available now 697,558.56 |
| Statement CSV | OK download | bingi-finance-statement-2026-11.csv, 24,129 bytes, 244 lines, no BOM |
| Statement PDF | OK download, heavy | bingi-finance-statement-2026-11.pdf, 1,046,280 bytes, ~5 s, no spinner (DOC-P1-14 / DOC-P2-01 still) |
| Commissions | OK view | Gross 829,021.14 · Commission 175.33 · Payable 828,845.81; Manual Booking 35 snapshots avg 0.01%; Meal Order 8 × 5%; QR Food Order 1 × 5%. Plan column raw "PLAN_BINGI_GROWTH" |
| Refunds | OK view | Create refund form (Payment ID / Transaction ID / Amount / Reason), "BinGi approves and processes it"; REF-2026-000001 PAY-2026-000243 Tk. 10,000 Requested |
| Subscription invoices | OK view | SIN-2026-000002 Aug 17 Paid Tk 5.00; SIN-2026-000006 Sep 15 Void 2,999; SIN-2026-000001 Void 1.00 |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Hotel payable = collected − commission − gateway | 835,552.14 − 146.03 − 1.73 = 835,404.38 | 835,699.38 | +295.00 WRONG (P0) |
| … also − SMS 37.60 | 835,366.78 | 835,699.38 | +332.60 |
| Root of +295 | — | Only one source fails: TXN-2026-000001 (ref SIN-2026-000002) collected 5, commission 3, gateway 0.13, payable 296.87. SIN-2026-000002 is the hotel's OWN subscription invoice paid to BinGi (Tk 5) – it was booked as guest money collected for the hotel | WRONG (P0) |
| Hotel payable > collected | never | 835,699.38 > 835,552.14 | WRONG |
| Available balance | payable − reserved − SMS − commission receivable | 835,699.38 − 138,071.05 − 37.60 − 28.85 = 697,561.88 | MATCH (formula) but built on wrong payable |
| Online vs desk money in "collected" | Finance = online (EPS / marketplace) only | payment_collected by method: Cash 542,592 · bKash 292,891.14 · EPS 69 → 99.99% is desk / own-bKash money | WRONG (P0, NEW-MON-P0-02 open) |
| New desk cash today | no Finance collected row | WBK-103 cash 16, FO-074 250, OFO-015 327 → no payment_collected rows (collected unchanged 835,552.14) | FIXED for new payments |
| Commission on hotel's own cash | none (founder: commission only on marketplace) | Meal cash FO-074 → commission_receivable 12.50, OFO-015 → 16.35 (5%), deducted from Available; Manual bookings still get 0.01% snapshots today (WBK-104 3.12, WBK-103 0.00) | WRONG (P1) |
| Settlement SET-2026-000001 | net = gross − commission − gateway − SMS | gross 138,119.14 − 29.19 − 0 = 138,089.95 − SMS 18.90 = 138,071.05 | MATCH (arithmetic) |
| SET-000001 content | only online money | period 31 Oct – 29 Nov (generated 11 Nov, period end in the future), 105 items, money is desk cash/bKash; status requested | WRONG (P0) – BinGi would pay out cash the hotel already holds |
| Statement payable | collected − deductions | 797,088.14 − 159.66 = 796,928.48 vs 796,951.78 (only commission deducted; SMS 23.30 not) | +23.30 WRONG (P1, DOC-P1-14 still) |
| Statement "Available now" vs Overview | same | 697,558.56 vs 697,561.88 | −3.32 WRONG (P2) |
| Commissions tab vs Overview | same commission | 175.33 vs 146.03 (+28.85 receivable = 174.88; + today's new snapshots) | different basis, no explanation (P2) |
| Refund REF-000001 10,000 | reserved from Available / shown as Refunded when done | Refunded 0.00; Available not reduced | PARTLY (requested only) |

### UI/UX vs approved design
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Tabs | 4: Overview · Ledger · Payouts · Statement (Commissions/Refunds = ledger filters; invoices only in Billing) | 7 tabs incl. Commissions, Refunds, Subscription invoices | NO |
| Overview KPIs | Paid online (Website & marketplace) · BinGi booking fees · Gateway · SMS · Online refunds · Paid out to you; "Cash and card at the hotel stay with you" | Total collected (all channels) · Commission · Gateway · SMS · Refunded · Hotel payable · Pending · Settled | PARTLY (layout yes, meaning no) |
| Subtitle | "Money guests paid online through BinGi…" | same text – but the numbers are mostly desk cash | text MATCH, data NO |
| Ledger | signed amounts, kind label, search + type | Direction column + raw type label | PARTLY |
| Payouts | request card + list, cancel request | same | MATCH |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| MON-P0-01 cash in Finance payable | PARTLY | PARTLY – new desk cash no longer posts; old 835K stays; meal cash now charged 5% receivable |
| MON-P0-02 / retest C1 +295 | PARTLY | STILL OPEN – cause found: subscription invoice SIN-2026-000002 booked as hotel collection |
| NEW-MON-P0-02 payout of desk cash | NEW | STILL OPEN – Available 697,561.88, SET-000001 138,071.05 requested |
| DOC-P1-14 statement payable | open | STILL OPEN (+23.30) |
| Retest D: walk-in fee 0.01% | open | STILL OPEN in commission snapshots (WBK-104 3.12 today) |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| D-FIN-P0-01 | Desk cash/bKash in Finance + payout | Overview / Payouts | Only EPS/marketplace (Tk 69) payable | Available 697,561.88; SET-000001 138,071.05 requested | Migrate: void payment_collected/hotel_payable rows where channel = hotel; cancel SET-000001 |
| D-FIN-P0-02 | Subscription payment counted as hotel income | ledger TXN-2026-000001 | Hotel→BinGi invoice payment never in hotel payable | collected 5 → payable 296.87 (+295) | exclude source SIN-*; fix payable calc for that row |
| D-FIN-P1-01 | 5% commission on hotel's own restaurant cash | pay FO / OFO in cash | 0 | 12.50 + 16.35 commission_receivable, cuts Available | commission only for marketplace channel |
| D-FIN-P1-02 | Statement payable ignores SMS | Statement Nov | 796,928.48 | 796,951.78 | one calc service |
| D-FIN-P1-03 | Refund request 10,000 not reserved | Refunds / Overview | Available − 10,000 while requested | not reduced | reserve like settlement |
| D-FIN-P2-01 | Raw labels | Ledger / Commissions | "Commission owed", "BinGi Growth" | "commission receivable", "PLAN_BINGI_GROWTH" | label maps |
| D-FIN-P2-02 | ?tab=payouts deep link breaks tabs | open URL | Payouts tab | Overview stuck | accept alias |
| D-FIN-P2-03 | Payout period ends in future (30/11) and SET period to 29 Nov generated 11 Nov | Payouts | end ≤ today | future | clamp |
| D-FIN-P2-04 | Statement PDF 1 MB, 5 s, no spinner; CSV no BOM | Statement | <100 KB, spinner, BOM | as stated | see DOC-P2-01 |

---

## 4. Expenses / Operations (/dashboard/operations)

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Overview (30 days) | loads | Expenses (approved + paid) BDT 31,375.00 · Paid 10,000.00 · Due 21,375.00 · Awaiting 99.00 · Pending 1 · Approved 5 · Rejected 1 · Completed 2 · Collected 830,539.14 · Net (collected − expenses) 799,164.14 |
| Create QA28 expense 5,200 (above 5,000 rule) | OK | EXP-2026-000017 "QA28 Generator repair", QA Repairs, status pending, needs_approval true; toast "Expense recorded successfully."; Awaiting Approval 99 → 5,299 |
| Pay before approval (API POST operations/expenses/17/payments 100) | OK blocked | 422 "Approve this expense before paying it." code expense_approval_required |
| Approve (Overview > Needs approval > Approve) | OK | toast "Expense marked as approved."; approved_by Md Yeapas 11:40; Expenses (approved+paid) 31,375 → 36,575 |
| Pay part cash 200 | OK | Status "Partly paid", Paid 200, Due 5,000; panel refreshed at once with "Cash · Md Yeapas · Cashbox CBM-2026-000083 · QA28 part cash" (EXP-P1-03 fixed) |
| Cashbox after payment | OK | cashbox/22 movement expense_adjustment QA Repairs EXP-2026-000017 −200; balance 31,938 → 31,738 (598 + 140 FO-077 + 31,200 WBK-104 by other agents − 200) |
| Reject paid (PATCH operations/expenses/17/status rejected) | OK blocked | 422 "This expense has already been paid, so it cannot be rejected…" |
| Draft paid | OK blocked | 422 "…cannot be moved back to draft" |
| Delete paid (DELETE operations/expenses/17) | OK blocked | 422 "This expense has already been paid, so it cannot be deleted…" ; cash unchanged 31,738 |
| Change-status dropdown in panel | BUG (P1) | still shows Draft / Waiting approval / Approved / Paid / Rejected (prototype: buttons only). BE now blocks bad moves, so UI offers actions that fail. |
| Supplier bills | OK | "Bills come from goods received in Inventory." QA Fresh Supply GRN-0001 · PO-0001 · Partly paid, paid 1,000, due 1,375 of 2,375, Pay bill. No supplier invoice no. |
| Payees | OK | PAYEE-2026-000004 QA Fresh Supply; Inventory suppliers list with "Use as payee" |
| Categories & rules | OK / gaps | Categories: QA Repairs, QA Utilities, qa utilities (duplicate, still no default 11 categories); "Other" and "Supplies" used on expenses but not in list. Approval rule On, "Now: BDT 5,000.00" (not changed) |
| Audit log | PARTLY | Rows "Expense #17 · created" AND "created expense" (duplicate), "updated" ×2 without what changed; StaffPayroll #5/#6 rows appear here too |
| New expense form | PARTLY | Placeholder still "Internet bill, kitchen stock, salary payout..."; Payment method field still present (means nothing); no Bill/receipt no. |
| Page title | BUG (P2) | Sidebar + top bar "Expenses", page H1 still "Operations" |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Approved+paid total (API GET operations/expenses, 10 rows before my test) | 7,000+6,000+2,375+0+800+12,000+3,200 = 31,375 | 31,375 | MATCH |
| Paid (excl. rejected) | 500+6,000+1,000+800+500+1,200 = 10,000 | 10,000 | MATCH (EXP-P1-02 fixed) |
| Net card | Received − paid expenses (prototype "Left after costs") | 830,539.14 − 31,375 (approved incl. UNPAID 21,375) = 799,164.14; after my approval 793,964.14 – unpaid approvals reduce "Net" | PARTLY (P1) – not cash basis |
| "Collected" this period | Same as Payments / Finance for the period | 830,539.14 (30 days) vs Finance statement Nov 797,088.14 vs Payments all-time 834,428 – three bases, none labelled | CHECK (P1) |
| Under-limit expense status | "To pay" | EXP-009 (0) shows "To pay" | OK (EXP-P1-01 fixed) |
| Amount 0 allowed | blocked | EXP-2026-000009 "QA zero" BDT 0.00 still exists approved | OPEN (P2, old data) |
| Rejected but paid 6,000 | can't exist | EXP-2026-000007 rejected, paid 6,000 (old data) | OPEN (P2, old data) |
| Payroll in Expenses | Payroll card (prototype) | no payroll card; payroll rows only in audit log | OPEN (EXP-P1-06) |
| bKash twice | once | operations/payment-methods returns two "payment-method-1 bKash" | OPEN (EXP-P1-04) |

### UI/UX vs approved design
| Screen | Prototype (components/hms/expenses) | Live | Match |
|---|---|---|---|
| Title | "Expenses" | "Operations" | NO |
| Overview | 4 money cards (Spent, To pay, Waiting approval, Left after costs = received − spent − payroll) + Payroll card | 10 cards incl. counts, Collected, Net; "Operations settings" debug block ("Recent expenses loaded 8 rows / Account tracking mode") still shown | NO |
| Expense panel | Approve / Reject / Pay buttons | status dropdown + Pay part or all + Mark paid | PARTLY |
| Expenses list | search, status/category/payee filters, chips | same | MATCH |
| Supplier bills | GRN · PO · date · invoice no. | no invoice no. | PARTLY |
| Tabs | Overview · Expenses · Supplier bills · Payees · Categories & rules · Activity | "Audit log" instead of Activity | PARTLY |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| EXP-P0-01 pay before approval | FIXED (retest) | FIXED – 422 expense_approval_required |
| EXP-P0-02 cash not posted | — | FIXED – −200 posted with CBM id |
| EXP-P0-03 status → Paid | FIXED in BE | BE FIXED, UI dropdown still there (P1) |
| EXP-P0-04 reject/draft paid | FIXED | FIXED – both 422 |
| NEW-EXP-P0-01 delete paid | FIXED | FIXED – 422 |
| EXP-P0-05 Net profit | FIXED (renamed) | PARTLY – unpaid approved expenses still deducted |
| EXP-P1-01 status on create | open | FIXED |
| EXP-P1-02 rejected in totals | open | FIXED |
| EXP-P1-03 stale panel | open | FIXED |
| EXP-P1-04 bKash twice | open | STILL OPEN |
| EXP-P1-06 payroll missing | open | STILL OPEN |
| EXP-P1-07 no default categories / duplicates | open | STILL OPEN |
| EXP-P1-08 payment method on create | open | STILL OPEN |
| EXP-P1-09 name Operations | open | PARTLY (sidebar "Expenses", H1 "Operations") |
| EXP-P2-04 audit "Expense #7" | open | STILL OPEN ("Expense #17") |
| EXP-P2-07 debug settings block | open | STILL OPEN |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| D-EXP-P1-01 | Status dropdown offers forbidden moves | open paid expense | Approve/Reject/Pay buttons only | Draft/Waiting/Approved/Paid/Rejected select | remove dropdown |
| D-EXP-P1-02 | "Net" deducts unpaid approved expenses | Overview | collected − paid | collected − approved (paid+due) | use paid_amount |
| D-EXP-P1-03 | Refund advice points to Cashbox Cash in, which has no "expense refund" reason | 422 text | dedicated "Refund from payee" | reasons: float / owner / bank / change / other | add reason + link to expense |
| D-EXP-P2-01 | H1 "Operations" | page | "Expenses" | "Operations" | rename |
| D-EXP-P2-02 | Audit log duplicate rows, "#17" | Audit log | "EXP-2026-000017 created · 5,200" | "created" + "created expense" | merge, show code + amount |
| D-EXP-P2-03 | Placeholder "salary payout" | New expense | "e.g. Electricity bill — November" | salary payout | text |

---

## 5. Billing & Subscription (/dashboard/billing-subscription) — view only

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Page load | OK | "BinGi Growth · Active · Monthly billing · Change plan · Next bill · 17 Oct 2026 · Renews 17 Oct 2026 · Nothing due now" |
| Rows | PARTLY | Rooms billed "—" · Bills go to Md Yeapas · Booking fees "5% · 1% · 0.01%" · How billing works |
| Bills list | OK | Aug 2026 SIN-2026-000002 Paid · Registration fee ৳5 [Download invoice]; Sep 2026 SIN-2026-000006 Cancelled ৳2,999; Aug 2026 SIN-2026-000001 Cancelled ৳1 |
| Change plan / Download invoice / pay | NOT CLICKED (out of scope / no purchase) | — |
| /dashboard/billing | 404 | real route is /dashboard/billing-subscription (only matters for old links) |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Next bill date | in the future | "Next bill · 17 Oct 2026" on 28 Nov 2026; API subscription/current next_billing_date 2026-10-17, grace_period_ends_at 2026-09-24, current_period_start/end null, auto_renew false – yet status active, "Nothing due now" | WRONG (P1) |
| Rooms billed | count of billable rooms (29 in house plan) | "—" (API rooms null, billable_rooms null, pricing_model room_package) | WRONG (P1) |
| Walk-in fee | 0 (founder: commission only on marketplace) | "0.01%" shown and still used in commission snapshots | OPEN (P1) |
| Invoice status words | one word | Billing "Cancelled" vs Finance > Subscription invoices "Void" for the same SIN-000006/000001 | P2 |
| Plan name | "BinGi Growth" everywhere | Billing "BinGi Growth"; Finance Commissions "PLAN_BINGI_GROWTH" (raw enum) | P2 |
| Currency | one format | Billing "৳5", Finance "Tk. 5.00", Expenses "BDT 5,200.00" | P2 (global) |
| Subscription payment in hotel ledger | never | SIN-2026-000002 (৳5) is booked in Finance as hotel payment collected → payable +296.87 (see D-FIN-P0-02) | WRONG (P0) |

### UI/UX vs approved design
| Screen | Prototype (components/hms/settings/billing.tsx) | Live | Match |
|---|---|---|---|
| Plan card | Plan, cycle, "This month's bill", auto-pay on/off | Plan, cycle, next bill, renews, change plan | PARTLY |
| Rows | Rooms billed (with count), Bills go to, Booking fees (Marketplace / Website / Walk-in labels), Auto-pay, How billing works | Rooms billed "—", fees as "5% · 1% · 0.01%" without labels, no Auto-pay row | PARTLY |
| Bills | list with status + Pay bill / overdue banner | list + Download invoice | MATCH |
| BinGi balance line "BinGi fees not covered by online payments" | present | absent | NO |

### Bugs
| ID | What | Expected | Actual | Fix idea |
|---|---|---|---|---|
| D-BILL-P1-01 | Next bill/renew date in the past, still "Active / Nothing due" | next date ≥ today or "Overdue" | 17 Oct 2026 | compute from period; show overdue |
| D-BILL-P1-02 | Rooms billed "—" | 29 rooms (or plan rule) | — | fill billable_rooms |
| D-BILL-P2-01 | Fees without labels | "Marketplace 5% · Website 1% · Walk-in 0%" | "5% · 1% · 0.01%" | labels (prototype) |
| D-BILL-P2-02 | Cancelled vs Void; raw PLAN_BINGI_GROWTH in Finance | same word, plan name | mixed | label map |

---

## 6. Reports (/dashboard/reports)

Note: other agents created WBK-2026-000104 (156,000, stay 4–7 Dec, paid 31,200 cash) and WBK-2026-000105 (6,000, checked out, cash 4,000 + bKash 2,000) and food orders while I tested, so "Today" numbers moved during the session. All comparisons below use one API snapshot taken at ~11:46 (reports/<type>?preset=today|this_month + bookings + meals/orders + operations/expenses + cashbox/22).

### Screens & functions tested
| Report (Today) | Result | Key numbers on screen |
|---|---|---|
| Daily Sales (default) | loads; bases mixed | Gross 163,171 · Room 160,266 · Food 1,405 · Service 1,500 · Refund due 10,000 · Collections 37,933 (Cash 35,933 + BKash 2,000) · Expenses 18,200 · Net Cash 19,733 · Outstanding 961,125 (first load showed Gross 111,171 / Room 108,266 / Outstanding 909,125 before WBK-104 was edited) |
| Master Sales | loads | Room collections 37,216 · Food 717 · Total 37,933 · Completed Expenses 0.00 · Net Sales 37,933 · Cashbox In 36,443 · Cashbox Out 705 · Cash movement net 35,738 |
| Sales Register | OK | 3 rows WBK-103 / 105 / 104; Total booking 162,016 · Paid 37,216 · Due 124,800 · Refund due 0.00; per-section CSV + PDF |
| Dashboard Summary | loads | Today's Revenue 163,171 · Bookings 3 · Occupancy 86.21% · Available 3 · Pending check-ins 3 / outs 1 · Total Due 961,125 · Refund Due 10,000 |
| Revenue Report | loads | Booked 163,171 · Collected 37,933 · Due 961,125 · Room 160,266 · Avg booking 53,422 · Monthly booked 1,675,180 · Monthly collected 836,539.14 |
| Booking Report | loads | Total 3 · Arrivals 2 · Base room amount 177,555 · VAT 0 · Total payable 162,016 · Paid 37,216 · Due 124,800; status chips raw "CHECKED OUT", "CONFIRMED" |
| Occupancy Report | BUG | Physical units 46 · In-house now 3 · Ready 2 · Blocked 0 · Capacity 29 — vs Dashboard Summary 86.21% occupancy / 3 available, and Bookings has 8 CHECKED_IN (retest C5 still open) |
| Guest Report | loads | Total 35 · Active 3 · New 3 · Avg spend 2,005.33 (= 6,016 / 3, ignores WBK-104 paid 31,200) |
| Payment Report | BUG | Collected 37,933 OK · Due Amount 688 · "Refund Due BDT 31,200.00" (Daily Sales says 10,000; 31,200 is WBK-104's advance) · Advance 33,200 · Full 4,000 · Payment collections 733 |
| Expense Report | BUG | Total Expenses 18,200 · Total Revenue 7,171 · Net Profit −11,029 · Profit margin −153.8% · "Other 13,000 (2 entries)" = EXP-015 7,000 (unpaid 6,500) + EXP-016 6,000 DRAFT |
| Meal Report | BUG | Meal revenue 1,155 vs Daily Sales food 1,405 (= meals/orders today, non-cancelled 1,405); category sales 1,169; test item names "Dolor quod velit se", "You cant afford it" (test data) |
| Excel (Sales Register) | downloads | daily_sales_register-report.xlsx 7,751 B in ~1 s. Cells: title "BINGI HOTEL MANAGEMENT", "Report Scope: Active report tab only", money as TEXT "BDT 16.00" / "BDT 6,000.00" (DOC-P1-08 still) |
| PDF (Sales Register) | downloads | daily_sales_register-report.pdf 883,238 B, ~4 s, 1 page, fonts DejaVuSans / DejaVuSans-Bold (no Bengali font – DOC-P1-07 still). No "Illustrative"/"SAL-0001"/"Design preview" in the raw file, but text is glyph-encoded so DOC-P0-02 could not be fully confirmed fixed |
| Print | NOT TESTED | Payments Print froze my tab (renderer dead); did not risk a second freeze |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Collections today vs Cashbox + bKash | cash 16 + 4,000 + 31,200 + 250 + 327 + 140 = 35,933; bKash 2,000 | 35,933 + 2,000 = 37,933 | MATCH |
| Cashbox In/Out (Master Sales) vs cashbox/22 | in = 35,933 + float 510 = 36,443; out = 500 + 5 + 200 = 705 | 36,443 / 705 | MATCH |
| Collections this month | Σ Nov payments; one row per method | Payment methods table: Cash 578,525 (33) · BKash 256,496.14 (13) · **Cash 1,518 (1)** = 836,539.14 → duplicate "Cash" row still (MON-P2-02) | WRONG (P1) |
| Expenses today | paid cash out of expenses = 700 (500 + 200) or approved 12,200 | 18,200 = EXP-015 7,000 + EXP-016 6,000 (draft) + EXP-017 5,200 – includes DRAFT and unpaid | WRONG (P1) |
| Expenses this month | Operations approved+paid 36,575 | Daily Sales 48,674 (all statuses incl. draft 6,000, pending 99, rejected 6,000); Expense report 48,774 (12 entries – also the hidden 2027-dated EXP-010 100) | WRONG (P1) – known gap persists, now 3 numbers |
| Net Cash today | collections − cash paid out (prototype "Collections − refunds − expenses paid") | 19,733 = 37,933 − 18,200; includes bKash 2,000 and unpaid/draft expenses; real cash net 35,738 (Master Sales) | WRONG (P1, known) |
| Master Sales "Completed Expenses" | paid expenses today 700 | 0.00 (only status "completed" counted) | WRONG (P1) |
| Room sales today | = bookings created today 162,016 (Booking report / Register) | 160,266 (−1,750, no explanation); this month 1,639,013 vs Nov-created live bookings 1,669,013.14 (−30,000) | CHECK (P1) |
| Future stay counted as today's sale | sales by night stayed (or label "bookings made") | WBK-104 (stay 4–7 Dec) = 156,000 inside "Today's Revenue 163,171" | OPEN (MON-P1-03, founder decision) |
| Outstanding due | = bookings live due | Reports 961,125 vs bookings API 958,809 (+2,316, same gap as retest); Payment report "Due 688"; Payments page 834K before today's bookings | WRONG (P1) – 3 numbers |
| Refund due | one number | Daily Sales / Revenue / Dashboard 10,000 (REF-000001) · Payment report 31,200 · Sales register 0.00; WBK-077 overpaid 154 nowhere | WRONG (P1) |
| Meals today | 1,405 (meals/orders non-cancelled) | Daily Sales 1,405 MATCH · Meal report 1,155 | WRONG in Meal report (P1) |
| Meals this month | 4,949 | Daily Sales food 4,949 / Meal report 4,949 | MATCH |
| Expense report "Total Revenue" | same as Revenue report | 7,171 vs 163,171 (drops WBK-104) | WRONG (P1) |
| Occupancy | one number | 3 in-house (report) vs 86.21% / 3 available (Dashboard Summary) vs 8 CHECKED_IN (Bookings) | WRONG (P1, retest C5) |

### UI/UX vs approved design
| Screen | Prototype (lib/reports/build.ts) | Live | Match |
|---|---|---|---|
| Report list | Daily sales · Sales register · Revenue & profit · Occupancy/ADR/RevPAR · Bookings & sources · Guests · Payments · Expenses · Restaurant & Bar · Other services · Inventory · Staff cost | Master Sales · Daily Sales · Sales Register · Dashboard Summary · Revenue · Booking · Occupancy · Guest · Payment · Expense · Meal (+ "Daily Sales Summary" heading) – no Services / Inventory / Staff cost, no ADR / RevPAR | PARTLY |
| Daily sales KPIs | "Expenses paid", "Net cash = Collections − refunds − expenses" | "Expenses" (all statuses), Net Cash = collections − expenses | NO (logic) |
| Revenue & profit | Revenue, Expenses paid, Payroll paid, Profit, Margin | Expense Report "Net Profit / Profit margin" on booked revenue | NO |
| Shared date range + PDF / Excel / Print | yes | yes | MATCH |
| Per-table CSV + search + sort | yes | yes | MATCH |
| Money format | ৳ whole / en-IN | "BDT 163,171.00" (Payments uses "Tk.", Billing "৳") | NO |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| MON-P2-02 duplicate Cash row 1,518 | open | STILL OPEN |
| Retest C2 expenses 30,474 vs 31,375 | open | STILL OPEN, worse: 48,674 / 48,774 vs Operations 36,575 (today 18,200 vs 700 paid) |
| Retest C2 Net Cash includes bKash | open | STILL OPEN |
| MON-P1-01 outstanding differs | open | STILL OPEN (+2,316) |
| MON-P1-03 future stays as today's sales | open | STILL OPEN (WBK-104) |
| Retest C5 occupancy 4 numbers | open | STILL OPEN |
| DOC-P1-08 Excel money as text | open | STILL OPEN |
| DOC-P1-07 PDF no Bengali font | open | STILL OPEN (DejaVu only) |
| DOC-P0-02 Sales Register PDF demo data | open | NOT CONFIRMED (no demo strings in raw file; text encoded) |
| DOC-P1-10 export wrong report if fast | open | NOT TESTED |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| D-REP-P1-01 | Expenses include draft/pending/rejected/unpaid | Daily Sales Today / This month | paid expenses (700 today; Operations basis) | 18,200 today; 48,674 / 48,774 month | one expense service: status in (approved, completed), use paid_amount for cash |
| D-REP-P1-02 | Net Cash not cash | Daily Sales | 35,738 (Master Sales cash net) | 19,733 | cash collections − cash out |
| D-REP-P1-03 | Duplicate "Cash" method row | Daily Sales This month | one Cash row | Cash 578,525 + Cash 1,518 | normalise method key (case / source) |
| D-REP-P1-04 | Refund due 31,200 in Payment report | Payment report Today | 10,000 (REF-000001) | 31,200 (WBK-104 advance) | refund due = requested/approved refunds + overpaid |
| D-REP-P1-05 | Outstanding: 961,125 / 958,809 / 688 | Daily Sales vs bookings vs Payment report | one number | three | shared query |
| D-REP-P1-06 | Master Sales "Completed Expenses 0.00" with 705 cash out | Master Sales | 700 | 0.00 | count paid_amount |
| D-REP-P1-07 | Meal report revenue 1,155 vs 1,405 | Meal report Today | 1,405 | 1,155 | same filter as Daily Sales |
| D-REP-P1-08 | Expense report revenue 7,171 vs Revenue 163,171; −153.8% margin | Expense report | same revenue basis, profit on received money | 7,171 | use Revenue service |
| D-REP-P1-09 | Room sales −1,750 today / −30,000 month vs bookings | Daily Sales vs Booking report | equal or explained | 160,266 vs 162,016 | document basis / fix |
| D-REP-P2-01 | Raw status labels "CHECKED OUT" | Booking report | "Checked out" | caps enum | label map |
| D-REP-P2-02 | Excel: money as text, generic title | Excel | numbers + hotel name | "BDT 16.00", "BINGI HOTEL MANAGEMENT" | write numeric cells |
| D-REP-P2-03 | PDF 883 KB for 1 page, DejaVu only | PDF | <100 KB, Bengali font | as stated | HTML→PDF with Noto Sans Bengali |

---

## Test data created (all 28 Nov 2026)
| Record | Where | Details |
|---|---|---|
| Cash in Tk 10 | Cashbox CB-2026-000022 | reason Top up the float, from "QA28 Tester", note "QA28 cash in test" (11:33) |
| Cash out Tk 5 | Cashbox CB-2026-000022 | Owner withdrawal, recipient "QA28 Tester", note "QA28 cash out test" (11:34) |
| EXP-2026-000017 "QA28 Generator repair" | Operations | 5,200, QA Repairs, approved by Md Yeapas 11:40, paid 200 cash (Cashbox CBM-2026-000083, note "QA28 part cash"), due 5,000 |
| Day close + reopen | Cashbox CB-2026-000022 | closed 11:48:37 counted 35,738 (matched), unpaid reason "QA28 test close…"; reopened with reason "QA28 reopen so other testers can keep taking cash today". Box left OPEN at 35,738. |
| Payments CSV / Finance statement CSV + PDF / Sales Register Excel + PDF | browser downloads only | no server data |
Nothing changed in settings (cashbox settings, approval rule 5,000, plan, payout). Request payout, Change plan, Pay bill, Download invoice NOT clicked.

## Not tested (why)
- Cash out larger than drawer (100,000): the browser tool's safety layer refused the click; covered by the 28 Nov retest (409).
- Close day WITH a variance submitted: only checked the UI rule (button disabled until reason); did not record a fake shortage on shared data.
- Next day's opening float: 29 Nov box cannot be opened today.
- Reports Print and Payments Print second try: Payments Print froze the tab (renderer dead, tab closed) – did not risk another freeze.
- DOC-P1-10 (fast tab switch exports wrong report) – time.
- Sales Register PDF content (DOC-P0-02) – file text is glyph-encoded; no demo strings in the raw bytes, but rows not verified.
- Role / permission effects (only owner account available); narrow width layout.
- Payout request, refund approval, online EPS payment – real-money / out of scope.
- Other agents changed data during the session (WBK-104/105/106, food orders FO-077, OFO-015); numbers are given with the time/snapshot used.
