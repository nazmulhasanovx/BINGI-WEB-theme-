# A Bookings, Guests, Chat — module audit 28 Nov 2026

Site hms.bingi.app (testing), property HTL-000001 Pan Pacific Sonargaon Dhaka, owner Md Yeapas. Business date Sat 28 Nov 2026, 11:20–12:30 Asia/Dhaka. Desktop Chrome 1568 px. Evidence = API (`api.bingi.app/api/...`) + on-screen text.

## Summary
- Works: list counts match the API (50 / Arrivals 3 / In house 8 / Payment Due 20 / Outstanding 834,009). New booking works for tonight AND future dates: the 28 Nov P0 (future availability hangs) is FIXED, 200 in 0.4–1.4 s. Multi-room, meals + services, discount + reason, coupon errors, advance %, extend, add charge, cash/bKash collection, check-out blocked with balance, invoice preview, chat send all work. Money maths inside a booking is right.
- Worst: (1) the Room board view shows 6 occupied rooms and 1 out-of-order room as "Free · Ready to sell" (regression of BKG-P0-03); (2) the Calendar "left" counts disagree with the booking engine; (3) the booking source is always saved as Walk-in; (4) cancelled/no-show money: refund due is missing from Payments, the guest profile and the labels, refunds still need Super Admin, and meal/service orders stay active after a cancel; (5) a no-show is allowed before arrival and is saved as "Cancelled"; (6) check-in says the dirty room 312 is "clean and ready", and check-in goes through without an ID.
- Guests: the list and profile match the prototype well. Problems: a cancelled or no-show booking (with money) is missing from the guest history, phone duplicates (3 profiles share one phone), and a different name on the same phone is merged without a warning.
- Chat: threads per booking, send and the info panel all work. The checked-out booking WBK-105 has no thread, the composer sits below the fold at 741 px height, and the unread flow was not tested (no guest side).
- Counts: P0 x 2 | P1 x 19 | P2 x 15 (Bookings 2/15/11, Guests 0/3/2, Chat 0/1/2).

## Bookings

### Screens & functions tested
| Screen / function | Result | Evidence |
|---|---|---|
| List KPI tiles | OK | "All bookings 50 · Arrivals today 3 · In house today 8 · Outstanding BDT 834,009 (20 bookings)". API `GET bookings?per_page=100` 200, total 50; due on non-cancelled = 834,009.00 (exact match); in-house (CHECKED_IN) = 8 |
| Tab All (50) | OK | 25 rows shown, no "Show more" / pager visible |
| Tab Arrivals (3) | OK | lists 103, 094, 089 = API check_in today (Asia/Dhaka) still CONFIRMED |
| Tab In House (8) | OK | 102, 090, 079, 077, 064, 043, 011, 010 — all 8 carry "Checkout overdue" |
| Tab Departures (1) | BUG | lists only WBK-080 (CONFIRMED, never checked in, check-out today). The 8 overdue in-house stays are not in Departures (BKG-P1-15 partly open) |
| Tab Payment Due (20) | OK | 20 = API count of non-cancelled with balance > 0 |
| Search by booking no. / room | OK | "000077" -> 1 row (077); "303" -> 1 row (092) |
| Filters status / source | PARTLY | Status list on Calendar: Confirmed, On hold, In house, Checked out (no Cancelled / No-show). Channel list: "BinGi Marketplace, Walk-in" only — Phone/Agent/Corporate absent because every HMS booking is saved as Walk-in |
| "Needs attention · 22 bookings" banner | PARTLY | Shows past-arrival Confirmed ("Needs review") and overdue in-house ("Checkout overdue"). Overpaid WBK-077 and cancelled-with-money WBK-092 are NOT flagged |
| Overdue chips | OK | "Checkout overdue" on all 8 in-house rows |
| Calendar view | PARTLY (big improvement) | Now grouped by category with "Price · left" row (e.g. "Premium Room · 5 units 20,000 / 5 left"), 7/14/30 days, legend. But counts wrong — see logic table |
| Room board view | BUG (P0) | "All rooms 46 · Free 41 · Arriving 5". Rooms 101, 102, 104, 206, 208, 209 (in-house overdue guests) show "Free · Ready to sell · No upcoming booking"; 207 (OOO) "Free · Ready to sell". In-house count missing. Board footer: "Tap a free room to start a booking" |
| New booking — tonight | OK | Rooms shown: Premium 4/5, Standard 1/1, Executive 4/4, Suite(41k) 2/5, Suite(60k) 4/5. Deluxe + Premium Deluxe not offered (occupied by overdue stays; 207 OOO) — correct |
| New booking — future date (5 Dec, 10 Dec) | OK (was P0) | UI reloads rooms in ~4 s. API `GET rooms?check_in=2026-12-05&check_out=2026-12-06` 200 in 1.4 s; `rooms?check_in=2026-12-10` 200 in 0.36 s. 10 Dec Suite(60k) 4/5 (505 held by QA Guest 20 -> correct). NEW-BKG-P0-01 FIXED |
| Room choice / multi-room | OK | 301 + 201 picked, summary "Room 301, Room 201 · ৳1,04,000" = (32,000+20,000)×2 |
| Capacity check | OK | 2 adults in Standard (1 guest) -> "Too many guests for this choice (max 1)" |
| Guest step — required | OK / P2 | Empty -> "Enter the guest's full name / Enter the guest's phone number" (red box at top). Phone "123" -> same text "Enter the guest's phone number" (should say invalid format) |
| Guest step — saved guest search | OK | "Saimon" -> "Saimon Hasan … Use" |
| Guest step — email optional | OK (was P0) | All 3 QA28 bookings created without email |
| Meals & services step | OK | QA Fried Rice ৳250 (5 Dec 08:00, Room 301) + QA Airport Pickup ৳1,500 (5 Dec 10:00) added; summary Meals (1) ৳250, Services (1) ৳1,500 |
| Coupon | OK | "QA28FAKE" -> "Invalid coupon code."; "WERWER" (only coupon, expired 5 Nov) -> "Coupon is not active or has expired." No active coupon exists, so a valid coupon was NOT TESTED (creating one = shared setting) |
| Discount + reason | OK / P1 UX | 1,750 without reason -> "Give a reason for the discount" — but message is at page top while user is at the bottom (not visible) |
| Payment Pay later / Advance / Full | OK / BUG | Advance chips 30% ৳31,200 / 50% ৳52,000 (of ৳1,04,000 after discount, correct). "Cash received" shows grey placeholder 31200 -> Confirm -> "Cash received must cover the payment being recorded." (BKG-P1-09 still open). Methods "Cash, bKash, bKash" — both bKash are the same hotel account listed twice. Full + bKash accepted with EMPTY transaction reference (WBK-106) |
| Source Walk-in/Phone/Agent/Corporate | BUG | Phone (104) and Agent (106) saved `source:"Walk-in"`, `booking_source:"manual"`, `guest_info.source:"Walk-in"`; header/list show "Walk-in". Agent/Corporate ask no agent / company name |
| Manage — Overview | OK / P2 | Total/Paid/Balance strip correct. "Room Type: Room", "Room 301, 201 · Room ·". Charges summary "Room & other booking charges 102,250" (discount netted into room) vs folio "Room 104,000 … Discount 1,750" |
| Manage — Stay & room | PARTLY | Future booking rooms tagged "Room Type: Twin · Occupied". Each room "2 Adults" though booking is 2 adults total. After check-in "Actual Arrival — Time not recorded" (P1-11 open) while Check-out panel shows "Check-in 28 Nov 2026, 11:39" |
| Manage — Guests | OK | primary + "Additional adult — Details not added" |
| Manage — Bill & folio | OK | Room 104,000 + Meal 250 + Service 1,500 = Subtotal 105,750, Discount 1,750, Total 104,000 |
| Manage — Payments | OK / BUG on cancel | Transactions table, Refunds sub-tab, Request Refund. For cancelled booking still "Balance Due BDT 124,800" (see logic) |
| Manage — Meals & services | OK / BUG on cancel | FO-2026-000079 + OSO-LWOH2WNHFR listed; after cancel they stay "Counter Pending" / "Scheduled" |
| Manage — Documents | OK | Payment receipts auto-issued per payment; Booking confirmation, Contract, Invoice templates. Invoice preview opens PDF viewer "Invoice (Draft) … NOT ISSUED" (2 pages). Invoice not auto-issued after checkout + full payment |
| Manage — Messages | PARTLY | Only "Communication history … No communication records" — not the booking chat thread (chat lives in Chat module) |
| Manage — Activity | OK / P2 | Created / Meal order / Payment / Service events. Check-in shown raw "—2026-12-04T18:00:00.000000Z" (UTC, shows 4 Dec for a 5 Dec arrival). Discount not logged as its own event. Order events "Actor: Not recorded" |
| Check-in | BUG | WBK-105 room 312: checklist "Room is clean and ready — Ready" while Room board + Calendar say 312 "Dirty — needs cleaning". ID "Not on file — Review" but check-in allowed after ticking "Guest details reviewed" (P1-10 open). "1 Nights" |
| Check-out with balance | OK | Balance 5,555 -> panel "Collect balance BDT 5,555 … Balance of BDT 5,555 is still unsettled", no Complete button |
| Check-out after payment | OK | "Complete check-out" -> Checked out · Paid; "Rooms will be marked Dirty" |
| Change dates / extend | OK | 104: 5–7 Dec -> 5–8 Dec: "+ BDT 52,000 … Revised 156,000 … New balance 124,800"; applied, header 156,000 |
| Move room | PARTLY | Dialog opens, lists only 204 and 303 as "Available" for 5–8 Dec (202, 203, 205, 401–405 also free per API). For a 2-room booking: "Move one-room bookings here; use room allocation for group bookings", Review & Move disabled; no way to choose which of 301/201 to move |
| Add charge | OK | QA28 Minibar 445 -> preview "5,555 + 445 = 6,000", applied. Still two clicks (Review -> Apply) |
| Collect payment cash | OK | 4,000 due, received 5,000 -> "Change to Return 1,000"; recorded |
| Collect payment bKash | OK (manual only) | Reference "Transaction / reference *" required, proof optional; recorded at once as received (no verification step). No gateway offered |
| Cancel with paid money | PARTLY | 104 (paid 31,200): needs "Request approval" -> same owner "Approve request" -> Confirm. Header "Cancelled · Refund due · Fee BDT 0 · refund due BDT 31,200" |
| Refund | BUG | Refund panel "Available credit BDT 0" (refund due 31,200), methods only Cash Return / Bank Transfer, text "Execute the approved refund in the existing Super Admin refund workflow". Not submitted |
| No-show | BUG | 104 (arrives 5 Dec) offered No-show tab. 106 (arrives today, check-in time 14:00) no-show done at 11:50; status saved "Cancelled", fee BDT 20,000 |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| total = rooms + meals + services − discount (104) | 104,000 + 250 + 1,500 − 1,750 = 104,000 | folio Total 104,000, API total_amount 104000.00 | OK |
| VAT / service vs room-type settings | rooms API vat_rate 0, service_charge_rate 0 for all types | no VAT/service lines; "Tax inclusive" | OK (VAT 0 is current shared setting; not changed) |
| Extend math | +1 night × (32,000+20,000) | +52,000 -> 156,000 | OK |
| Add charge math (105) | 5,555 + 445 | 6,000 | OK |
| Paid vs Payments module (105) | 2 rows: bKash 2,000 + Cash 4,000 | Payments list: 1 row "WBK-2026-000105 … Cash … Tk. 6,000 Fully Paid"; API payment_method "Cash" | BUG — bKash part shown as Cash |
| Paid vs Payments module (104) | 31,200 cash | "Tk. 104,000 / Tk. 31,200 Partial Paid" (row total is old 104,000; booking now 156,000 then cancelled) | BUG |
| Outstanding Bookings vs Payments | same | Bookings 834,009 (before my tests) + 72,800 (104 before cancel) ≈ Payments "Balance due Tk. 907K" | OK |
| payment_status label vs numbers — 077 | overpaid 154 -> "Refund due / credit" | total 2,969.14, paid 3,123.14, Due 0, "Fully Paid", not in Needs attention | BUG (BKG-P1-04 open) |
| Cancelled with paid money — 092 | "Cancelled · Refund due 10,000" | list "Cancelled 64,000 / 10,000 / Due 0"; Payments "Partial Paid"; API payment_status "Partial Paid" | BUG |
| Cancelled 104 balance | Balance 0, refund due 31,200 everywhere | header OK; Payments tab "Balance Due BDT 124,800"; API payment_status "Partial Paid" | BUG (BKG-P1-12 open) |
| Cancel -> orders | meal/service of cancelled stay cancelled or flagged | FO-079 "Counter Pending", airport pickup "Scheduled"; dialog: "Cancelling this booking does not automatically cancel or refund these orders" | BUG |
| No-show timing | only after arrival day / night audit | allowed 7 days before arrival (104 dialog) and at 11:50 on arrival day (106) | BUG (BKG-P1-14 open) |
| No-show status | "No-show" | "Cancelled" | BUG |
| Past arrivals | night audit marks No-show | 16 bookings with arrival 10 Aug–27 Nov still CONFIRMED (e.g. 004, 008, 021, 080, 082, 101) | BUG (BKG-P1-03 open) |
| Room board vs bookings tonight | 101,102,104,206,208,209 occupied; 207 OOO | all "Free · Ready to sell" | P0 regression (BKG-P0-03) |
| Calendar "left" vs availability API (tonight) | Premium Deluxe 0 left (3 overdue + 207 OOO); API omits the type | Calendar 28 Nov "18,000 · 4 left" | BUG |
| Calendar vs API (5 Dec) Deluxe | same number | Calendar "5 left"; API `available_room_count 1/5`; New booking offers only 105 | BUG (two engines disagree) |
| Room readiness at check-in (312) | Dirty -> warn / block | "Room is clean and ready — Ready" | BUG |
| Guest de-dup by phone | same phone -> same profile, warn if name differs | 106 "QA28 Agent Guest" with phone of 105 silently linked to GST-00000104 "QA28 Walkin Guest" (badge "Returning Guest") | PARTLY |

### UI/UX vs approved design (prototype src/components/hms/bookings/*)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| List header / KPI | "In house 14 · 10 rooms free tonight", Walk-in button | KPI tiles, no free-tonight line, no Walk-in shortcut | PARTLY |
| List rows | room + category, source badge with icon, tags Leaves today / Room dirty / VIP | "105 Twin" for every row, plain "Walk-in", tags only Checkout overdue / Needs review | PARTLY |
| Money format | ৳45,540 / ৳3,73,174 | list "BDT 834,009" / "20,000"; booking page "BDT 104,000"; new booking "৳1,04,000"; Payments "Tk. 2007K", "Tk. 28,117.037" | NO |
| New booking | 4 steps, room chips, summary | same 4 steps + chips + summary; "Estimate — the server re-prices VAT, service charge and meals"; "Breakfast + Lunch + Dinner included" on every type; breadcrumb "Reservations > New" | PARTLY |
| Booking page | 7 tabs, Bill & payments card, ID-required inline check-in | 9 tabs, side drawer check-in, ID optional | PARTLY |
| Calendar | grouped by category, price + free per day, coloured bars | grouped + "Price · left" now; apartments ("Tow bad room · 17 units", all "Not live", "Full") listed first; overdue in-house stays have no bar | PARTLY (better than 24 Nov) |
| Room board | chips All/Free/Arriving/In house/Leaving/OOO, grouped, guest + due on card | chips All 46 / Free 41 / Arriving 5 only, grouped by category, cards "Free · Ready to sell" | PARTLY layout, NO data |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| BKG-P0-01 occupied rooms sold | NOT FIXED | FIXED in New booking (tonight + future skip overdue rooms) |
| BKG-P0-02 email required | NOT FIXED | FIXED |
| BKG-P0-03 room board vs bookings | NOT FIXED (fixed per retest) | REGRESSED on Room board view: 6 occupied + 1 OOO shown Free |
| BKG-P0-04 move room | PARTLY | PARTLY — opens, but short list and multi-room blocked |
| NEW-BKG-P0-01 future availability hangs | NEW (28 Nov retest) | FIXED — 200 in 0.4–1.4 s |
| P1-01 error out of view | open | PARTLY — guest step errors visible; discount / cash errors at top while user at bottom |
| P1-03 past Confirmed never No-show | open | OPEN (16 bookings) |
| P1-04 overpaid shows Due 0 | open | OPEN (077) |
| P1-08 source lost | open | OPEN (Phone, Agent saved Walk-in) |
| P1-09 cash received placeholder | open | OPEN |
| P1-10 check-in without ID | open | OPEN |
| P1-11 actual check-in time | open | OPEN on Stay tab |
| P1-12 cancelled two balances | open | OPEN (104: header 0 / Payments 124,800) |
| P1-13 refund needs Super Admin | open | OPEN |
| P1-14 no-show saved Cancelled / allowed early | open | OPEN |
| P1-15 arrivals/departures | open | Arrivals FIXED; Departures still misses overdue |
| P1-17 calendar | open | MOSTLY FIXED (room numbers, grouping, prices); apartments first, counts wrong |
| P2-02 "Room Type: Room" | open | OPEN |
| P2-05 "1 Nights", "CONFIRMED · Unpaid" | open | OPEN |
| P2-12 Check in button 7 days ahead | open | OPEN (104, 5 Dec) |
| P2-18 developer words | open | OPEN ("snapshotted cancellation or no-show fee", "Super Admin refund workflow") |
| Retest P2 "Cash, bKash, bKash" | open | OPEN |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| A-BKG-P0-01 | Room board shows occupied and OOO rooms as Free / Ready to sell | Bookings > Room board, 28 Nov | 101,102,104,206,208,209 "In house · overdue"; 207 "Out of order" | all "Free · Ready to sell · No upcoming booking"; header "Free 41" | Board must read the same occupancy as New booking (overdue CHECKED_IN = occupied until checked out) and OOO from maintenance |
| A-BKG-P0-02 | Calendar availability counts disagree with booking engine | Calendar 14 days vs `GET rooms?check_in=` | same "left" numbers | Premium Deluxe tonight "4 left" (API: 0 sellable); Deluxe 5 Dec "5 left" (API 1/5) | One availability service for calendar, board and new booking |
| A-BKG-P1-01 | Booking source always Walk-in | New booking source Phone / Agent | source phone / agent | `source:"Walk-in"` (104, 106) | FE send chosen source; BE store source_channel; add agent / company field |
| A-BKG-P1-02 | Check-in into dirty room says "clean and ready" | 105 room 312 (board: Dirty) > Check in | warning / block "Room 312 needs cleaning" | "Room is clean and ready — Ready" | Read housekeeping status in check-in checklist |
| A-BKG-P1-03 | Cancel leaves meal and service orders active | Cancel 104 with Fried Rice + Airport Pickup | orders cancelled or flagged to kitchen / transport | "Counter Pending" / "Scheduled" stay | Cancel or put on hold child orders on booking cancel/no-show |
| A-BKG-P1-04 | No-show allowed before arrival / before check-in time, saved as Cancelled | 106 arrival today 14:00 -> No-show at 11:50; 104 arrival 5 Dec shows No-show tab | No-show only after arrival day (night audit) ; status No-show | allowed; status CANCELLED, fee 20,000 | Gate by business date; separate NO_SHOW status |
| A-BKG-P1-05 | Cancelled / overpaid money labels wrong | 092, 104, 077 | "Refund due ৳x" in list, Payments, Needs attention | 092/104 "Partial Paid", Due 0; 077 "Fully Paid" Due 0 | payment_status REFUND_DUE / OVERPAID; flag in Needs attention |
| A-BKG-P1-06 | Cancelled booking Payments tab shows full balance | 104 after cancel > Payments | Balance 0, Refund due 31,200 | "Balance Due BDT 124,800" | Use same settlement calc as header |
| A-BKG-P1-07 | Refund cannot be done by hotel; available credit 0 | 104 > Payments > Request Refund | credit 31,200, bKash back option | "Available credit BDT 0", Cash Return / Bank Transfer only, "Super Admin refund workflow" | Credit = paid − fee; add bKash; hotel-side execute |
| A-BKG-P1-08 | Mixed payment shown as Cash | 105 bKash 2,000 + cash 4,000 | 2 rows / "Cash + bKash" | Payments list 1 row "Cash 6,000"; API payment_method Cash | List per transaction, not per booking |
| A-BKG-P1-09 | bKash at new booking accepted without reference | New booking Full + bKash, empty "Transaction ID / reference" | required like Collect payment | 106 saved Fully Paid bKash, no reference | Same validation in both flows |
| A-BKG-P1-10 | Cash received placeholder looks filled (old P1-09) | Advance 31,200 cash, leave Cash received | pre-filled value or empty | grey "31200" -> "Cash received must cover the payment being recorded." | Prefill value = amount |
| A-BKG-P1-11 | Check-in without ID (old P1-10) | 105 check-in, ID "Not on file" | block until NID/passport (police register) or policy setting | allowed after tick | Property policy "ID required at check-in" default on |
| A-BKG-P1-12 | Departures tab misses overdue stays | Departures tab | 8 overdue + due today | only 080 (never checked in) | Departures = CHECKED_IN with check_out ≤ today |
| A-BKG-P1-13 | Past Confirmed bookings never closed | List | No-show / review after arrival day | 16 still CONFIRMED (Aug–27 Nov) | Night audit |
| A-BKG-P1-14 | Move room list incomplete; multi-room cannot move | 104 > Move / Upgrade | all free rooms for dates; pick which room | only 204, 303; "Move one-room bookings here" | List from availability API; room selector for multi-room |
| A-BKG-P1-15 | Errors shown at page top, out of view | Review step: discount without reason / cash received | message next to field, scroll to it | red text at top, user at bottom | Inline errors + scrollIntoView |
| A-BKG-P2-01 | Activity shows raw UTC timestamp | 104 > Activity | "Sat 05 Dec 2026" | "Check-in —2026-12-04T18:00:00.000000Z" | Format in property TZ |
| A-BKG-P2-02 | Cancel/no-show reason default text concatenated | type reason | only typed text | "Guest requested cancellationQA28 cancel…", no-show "QA28 no-show …Guest requested cancellation" | Use placeholder, not value; no-show default "Guest did not arrive" |
| A-BKG-P2-03 | "Room Type: Room" / "Twin" / "Occupied" on future booking | 104 Stay & room | "Executive Suite", "Reserved" | "Room Type: Twin Occupied" | Use category name + state |
| A-BKG-P2-04 | Duplicate bKash method | Payment methods | one per account | "Cash, bKash, bKash" (same account twice) | De-dup payment accounts |
| A-BKG-P2-05 | Currency format mixed | list / booking / new / Payments | one format ৳ with lakh grouping | "BDT 834,009", "৳1,04,000", "Tk. 2007K", "Tk. 28,117.037" | One money formatter |
| A-BKG-P2-06 | Phone "123" says "Enter the guest's phone number" | Guest step | "Enter a valid phone number (01XXXXXXXXX)" | generic text | Format validation text |
| A-BKG-P2-07 | Two room types both named "Suite" (41,000 / 60,000) | New booking, Calendar merges "Suite · 10 units 41,000" | distinct names | same name; calendar shows one price for both | Unique names or show both |
| A-BKG-P2-08 | Apartments ("Tow bad room · 17 units", Not live) on top of Calendar and Room board ("Free · Ready to sell") | Calendar / Room board | hide not-live units or put last | first, and board says ready to sell | Filter by live / sellable |
| A-BKG-P2-09 | "1 Nights", "CONFIRMED · Unpaid" | Check-in review | "1 night", "Confirmed · Unpaid" | as quoted | Plural + label map |
| A-BKG-P2-10 | Overview "Room & other booking charges 102,250" vs folio Room 104,000 + Discount 1,750 | 104 Overview | same breakdown | discount netted silently | Show discount line |
| A-BKG-P2-11 | Booking "Messages" tab is not the chat | 104 > Messages | booking chat thread | "Communication history … No communication records" | Embed chat thread / link to Chat |

## Guests

### Screens & functions tested
| Screen / function | Result | Evidence |
|---|---|---|
| Guest list + KPIs | OK | "Guests 35 · 7 In house now · 9 Arriving · 4 Returning guests · 5.0 Average rating · 1 review". API `GET guests/directory` 200, 35 guests; state counts: In house 7, Arriving today 3 + Upcoming 6 = 9, Checked out 14, No stay yet 5; stays_count>1 = 4 |
| Filter chips | OK | All 35 / In house 7 / Arriving 9 / Returning 4 / VIP 0 / ID missing 30 / Blocked 0 |
| Row content | OK | e.g. "QA28 Walkin Guest GST-00000104 ID missing 01700002802 Checked out 1 29 Nov 2026 BDT 6,000" |
| Profile (GST-00000104) | OK | Stays 1, Nights 1, Paid so far BDT 6,000, Stays table, Reviews, Contact & ID "ID needed before check-in · Add ID", Preferences, Team notes, Mark as VIP / Block / Delete ("Guests with stays are kept for your records") |
| Booking history | BUG | GST-104 shows only WBK-105; no-show WBK-106 (same guest_id, BDT 20,000 kept as fee) missing. GST-103 (WBK-104 cancelled, paid 31,200, refund due) shows "No stays yet · Paid so far —" |
| Saimon Hasan profile (GST-025) | PARTLY | 4 stays, Paid so far BDT 76,827 (= 3,123.14 + 34,688 + 39,000 + 16 paid). Row 077 shows "Paid BDT 2,969" (overpaid 154 hidden); guest "Checked in" on 077 AND 064 at the same time; OBK-076 (31 Aug) still "Confirmed · Paid" |
| Currency | OK on Guests | all "BDT" (18 occurrences), no ৳/Tk mix inside the module. Different from Bookings / Payments (see A-BKG-P2-05) |
| Duplicates | BUG | phone …98119729 on 3 profiles: GST-025 Saimon Hasan, GST-004 NAZMUL, GST-002 NaZmul. Name "nazmul" on 3 profiles |
| New booking with existing phone, other name | PARTLY | WBK-106 "QA28 Agent Guest" + phone of GST-104 -> linked to GST-104 (good de-dup) without any warning; booking page then shows "Returning Guest" while profile says Stays 1 |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| In house guests vs bookings | 8 in-house bookings | 7 guests (GST-025 holds 077 + 064) | OK (explained) — but one guest in two rooms is old bad data |
| Paid so far vs Payments | includes all money kept by hotel | GST-104 6,000 (excludes 20,000 no-show fee); GST-103 "—" (31,200 held, refund due) | BUG |
| Last stay date | actual check-out 28 Nov | GST-104 "29 Nov 2026" (planned date) | P2 |
| Returning badge | stays ≥ 2 | "Returning Guest" on booking page with stays 1 | P2 |

### UI/UX vs approved design (src/components/hms/guests/list.tsx, profile.tsx)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| List | "Guest list", chips In house / Arriving / Returning / ID missing / Blocked, KPI "In house now", "Returning guests" | same chips + VIP, same KPI words | MATCH |
| Profile | Stays / Nights / Paid so far / Rating given, Stays table, Add ID, Mark as VIP, Block reasons | same blocks | MATCH |
| Stays table source | channel name | raw "Hms", "Bingi mobile app" | PARTLY |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| (no separate Guests list in 02_Bookings.txt) | — | Saved guest search in New booking still OK |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| A-GST-P1-01 | Cancelled / no-show bookings with money missing from guest history | Guests > GST-103, GST-104 | all bookings incl. cancelled/no-show, with refund due / fee | "No stays yet"; 106 missing | History = all bookings of guest_id, filter chip "Cancelled" |
| A-GST-P1-02 | Duplicate guest profiles by phone | Guests list | one profile per phone or merge tool | 3 profiles share one phone | De-dup on normalised phone; merge action |
| A-GST-P1-03 | Silent merge of a different name on same phone | New booking name "QA28 Agent Guest" + existing phone | prompt "This phone belongs to QA28 Walkin Guest — use / new" | silently linked | Show match card under phone field |
| A-GST-P2-01 | Raw source names in stays table | Profile | "Walk-in / Phone / Marketplace / Mobile app" | "Hms", "Bingi mobile app" | Label map; spell BinGi |
| A-GST-P2-02 | Last stay = planned check-out, "Returning Guest" on first stay | GST-104 | 28 Nov; no badge | 29 Nov; badge shown | Use actual check-out; badge from stays ≥ 2 |

## Chat

### Screens & functions tested
| Screen / function | Result | Evidence |
|---|---|---|
| Thread list | OK | "All 43 · Unread 0 · Enquiries 1". API `chat/conversations` 200, 43 rows (42 booking + 1 inquiry OBK-013), `chat/summary` {unread 0} |
| Thread per booking | PARTLY | New WBK-104, 106 got threads at once. WBK-105 (checked out today) has no thread in list / API |
| Open thread | OK | `?booking=WBK-2026-000106`, header "QA28 Agent Guest · Room 205 · Nov 28 → Nov 29", right panel Status Cancelled, Payment Fully paid, Paid BDT 20,000, Due BDT 0, Source Walk-in, Open booking, Shared media |
| Send message (QA28 test booking only) | OK | "QA28 test message from front desk" -> list "11:52 AM · You: QA28 test message…"; API last_chat_message same, sender "hotel" |
| Unread counts | NOT TESTED | needs a guest-side message (Guest App) — 0 unread everywhere |
| Quick replies / Payment details button | Seen, not used | buttons present |
| Composer layout | P2 | "Write a message..." and Send are off-screen at 1568×741 until the page is scrolled |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Unread total (summary vs list) | equal | 0 / 0 | OK |
| Panel money vs booking | same | 106 Paid 20,000 Due 0 = booking | OK |
| Panel source | Agent | "Walk-in" (source bug A-BKG-P1-01) | BUG (inherited) |

### UI/UX vs approved design (src/components/hms/chat/page.tsx)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Chat | All / Unread / Enquiries, Quick replies, New conversation, booking info panel (Booking, Status, Room, Stay, Payment, Source, Phone, Email), "No messages yet" | same structure | MATCH (composer below fold) |
| Booking page "Messages" tab | — (prototype "Documents & messages") | communication log only, not the chat | PARTLY |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| A-CHT-P1-01 | Checked-out booking has no chat thread | Chat list / API for WBK-105 | thread exists (guest may message after stay) | absent; 43 threads vs 50+ bookings | Create thread for every booking or show reason |
| A-CHT-P2-01 | Composer below the fold | Open any thread at 741 px height | composer pinned at bottom of viewport | needs page scroll | Use h-[100dvh] layout, sticky composer |
| A-CHT-P2-02 | Booking "Messages" tab not linked to chat | Booking > Messages | show / link thread | "No communication records" | Add "Open chat" link |

## Test data created
| Record | Details | Final state |
|---|---|---|
| WBK-2026-000104 | QA28 Phone Guest (GST-00000103, 01700002801), source chosen Phone, rooms 301 + 201, 5–7 Dec, extended to 8 Dec; meal FO-2026-000079 (QA Fried Rice ৳250), service OSO-LWOH2WNHFR (QA Airport Pickup ৳1,500); discount ৳1,750 "QA28 test discount"; advance cash ৳31,200 TXN-2026-000093 | CANCELLED, refund due ৳31,200 (refund NOT executed); orders still Counter Pending / Scheduled |
| WBK-2026-000105 | QA28 Walkin Guest (GST-00000104, 01700002802), Walk-in, room 312, 28–29 Nov; charge "QA28 Minibar" ৳445; bKash ৳2,000 ref QA28BK001 (TXN-2026-000095) + cash ৳4,000 (received 5,000, change 1,000; TXN-2026-000096) | CHECKED_OUT, Fully Paid ৳6,000; room 312 marked dirty by checkout |
| WBK-2026-000106 | "QA28 Agent Guest" (linked to GST-00000104), source chosen Agent, room 205, 28–29 Nov, Full bKash ৳20,000 without reference (TXN-2026-000097) | CANCELLED via no-show, fee ৳20,000 |
| Chat message | thread WBK-2026-000106: "QA28 test message from front desk" | sent |
| Guests | GST-00000103, GST-00000104 created by the bookings | — |
No shared settings changed (VAT, rooms, prices, cashbox, plan untouched). Cash ৳35,200 + bKash ৳22,000 entered the testing cashbox/ledger through these bookings.

## Not tested (why)
- A valid coupon: the only coupon WERWER expired 5 Nov; creating one changes shared Discounts settings.
- Refund execution: it needs the Super Admin refund workflow (out of scope), and it would move money.
- Corporate source: UI is the same as Agent (no company field), and the 3-booking limit was used for Walk-in / Phone / Agent.
- Unread chat counts and guest-side messages: no Guest App session.
- The Move room action itself was not done: the multi-room booking is blocked, and the single-room bookings were checked out or cancelled.
- Narrow / mobile width: no resize done.
- Invoice "Issue", contract sign, and email send: these send or issue documents, so only the preview was opened.
- Night audit / day close: not run, because it changes shared business data.
