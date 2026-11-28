# B Dashboard, Rooms, Housekeeping, Rates — module audit 28 Nov 2026

Tester: QA agent B · Site https://hms.bingi.app · HTL-000001 Pan Pacific Sonargaon Dhaka · owner user 75 · business date 2026-11-28 · Chrome 1568 px.

## Summary
- Works: Rooms/Room numbers now read the tonight engine (overdue chip, 207 OOO not sold); housekeeping task flow start → checklist → inspection → ready updates rooms + availability; maintenance block removes the room from tonight API and New booking and closing returns it; coupon create / scope / math / pause works; future-date availability loads (~1.3 s).
- Worst: Dashboard occupancy/available come from legacy room status (RESERVED = any future booking): 82.8-86.2% vs truth 41%; a 5 Dec booking changed "available tonight". Room revenue today = sales booked today (16 → 109,766). Deluxe still PENDING "units stay drafts" while sold. 404 phantom guest. Seven different "available/ready" numbers across Dashboard / Rooms / HK / Occupancy report / Rate calendar.
- Count: P0 1 · P1 11 · P2 11 (new IDs in this file; plus many old items still open, listed per module).


## Dashboard

Truth table for tonight 28 Nov (built from GET /api/bookings (50 rows) + accommodation_allocations + GET /api/accommodations/tonight + GET /api/accommodations/units (46 units) + GET /api/rooms (7 types)):

| Room | Truth from bookings | Legacy operational_status (/api/rooms + units) | tonight API state / housekeeping |
|---|---|---|---|
| 101 | WBK-102 CHECKED_IN 25-26 Nov, overdue | OCCUPIED | booked / occupied, overdue |
| 102 | WBK-043 CHECKED_IN 2-3 Nov, overdue | OCCUPIED | booked / occupied, overdue |
| 103 | WBK-090 CHECKED_IN 24-26 Nov, overdue | OCCUPIED | booked / occupied, overdue |
| 104 | WBK-079 + WBK-077 both CHECKED_IN, overdue (2 guests 1 room, old) | OCCUPIED | booked / occupied, overdue |
| 105 | WBK-103 CONFIRMED arriving 28-29 | RESERVED | booked / inspection |
| 204 | WBK-089 CONFIRMED arriving 28-30 | AVAILABLE | booked / clean |
| 206 | WBK-011 CHECKED_IN Sep, overdue | AVAILABLE | booked / clean, overdue |
| 207 | maintenance mnt_dsz2mpsrwn Open, OUT_OF_ORDER | RESERVED | ooo / maintenance |
| 208 | WBK-064 CHECKED_IN 4-5 Nov, overdue | OCCUPIED | booked / occupied, overdue |
| 209 | WBK-010 CHECKED_IN Sep, overdue | OCCUPIED | booked / occupied, overdue |
| 312 | no stay | DIRTY | available / dirty |
| 401, 402 | WBK-082 CONFIRMED 27-29 (not checked in) | RESERVED | booked / clean |
| 404 | **no booking covers tonight** (WBK-100 CONFIRMED 24-25 never checked in; WBK-093 cancelled) | OCCUPIED | **booked / occupied** |
| 502 | WBK-094 CONFIRMED arriving 28 Nov-1 Dec | RESERVED | booked / clean |
| other 13 (201,202,203,205,301-304,403,405,501,503-505) | none tonight | 201,303 AVAILABLE; rest RESERVED | available / clean |

Truth: 12 rooms occupied/booked tonight (7 in-house overdue rooms + 5 arriving/stay-over), 1 OOO (207), 16 free (15 clean + 312 dirty). tonight API: booked 13 / available 15 / ooo 1 / draft 17 (13 = 12 + phantom 404).

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| KPI Arriving today = 3 | OK | stats.today_checkins.checkins 3; list QA Guest 10 (204), QA Guest 15 (502), QA Retest NoEmail (105) = allocations with check_in 2026-11-28 |
| KPI Occupancy 82.8% "25 of 29 rooms" | BUG | GET /api/dashboard/stats available_rooms {available 4,total 29}; occupancy = (29-4)/29. Truth 12/29 = 41.4% (tonight API 13/29 = 44.8%) |
| KPI Available rooms 4 | BUG | 4 = count of legacy operational_status AVAILABLE among 29 published: 201, 204, 206, 303. 204 is arriving today and 206 has a checked-in guest; 13 truly free rooms (202,203,205,301,302,304,403,405,501,503,504,505 + 201/303) are counted as "occupied" because their legacy status is RESERVED (sticky from old bookings). tonight API says 15 available |
| KPI Room revenue today BDT 16 | BUG (P1, label) | stats.revenue_today {value 454, room_value 16, meal_value 438}. 16 = cash collected today on WBK-103. Prototype rule = nightly rate of stays in house (dashboard.tsx: sum total/nights). Bookings covering tonight: 105 16 + 502 60,000 + 204 19,000 + 401/402 82,000 = 161,016/night; 7 overdue in-house rooms post no night charge at all |
| Prepare arriving rooms "2 ready · 2 need cleaning", "2 of 4 available rooms ready" | BUG (P1) | stats.plan_dashboard.housekeeping {ready_rooms 2, needs_cleaning 2}. Arrivals = 3 rooms: 204 clean, 502 clean, 105 inspection (task tsk_vg5ykktz Awaiting Inspection). "2 need cleaning" has no basis among arrivals (only 105 not ready), and denominator "4 available" is the wrong KPI above, not the 3 arrivals |
| Website & booking card: Published, Domain not connected, fees 5% / 1% / 0.01% | PARTLY | stats.plan_dashboard.commission_rates {marketplace 5, website 1, walk_in 0.01}. Founder rule: commission only on marketplace bookings; 0.01% walk-in fee still shown (same as retest P1) |
| Arriving list (Guest, Room, Stay, Status, Due, Open) | OK / P2 | 3 rows, due BDT 26,600 / 180,000 / 0. Status chip upper-case "CONFIRMED" (prototype "✓ Confirmed") |
| total_bookings 52 "+160%" | CHECK | /api/bookings total = 50 (all statuses); stats says 52. Not shown on the card set I saw; flag only |
| daily-operations room_status | BUG (P1) | GET /api/dashboard/daily-operations room_status {total 46, vacant 35, occupied 7, arriving 3, dirty 1, out_of_order 0, blocked 0}: counts 17 drafts in total/vacant and 0 OOO although 207 is OOO |
| Greeting "Good morning, Md" | P2 | first name only; prototype "Md Yeapas" |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Occupancy rule | rooms with a stay covering tonight / published rooms | (published - legacy AVAILABLE) / published = 25/29 | WRONG — root cause of the 25 vs 13 mismatch |
| Dashboard vs tonight API vs truth | one number | Dashboard 25 occupied/4 free · tonight 13 booked/15 free/1 OOO · truth 12/16/1 | WRONG |
| tonight API phantom | 404 free (no stay) | 404 "booked / occupied" from legacy OCCUPIED | WRONG (old ROOM-P0-01 back for 404) |
| Overdue | 7 overdue rooms flagged | tonight overdue_checkout_count 7 (101,102,103,104,206,208,209) | MATCH |
| Arrivals | 3 | 3 | MATCH |
| Stale CONFIRMED past stays | auto no-show / flagged | 9 allocations CONFIRMED with check_out <= today (WBK-080,081,087,088,098,100,101 …) still "confirmed"; legacy keeps their rooms RESERVED | WRONG (feeds the dashboard error) |
| Booking dates in API | local date | bookings.check_in "2026-11-27T18:00:00Z" for a 28 Nov stay (UTC); allocations carry the right local date. Any client using check_in.slice(0,10) is one day early | RISK (P2) |
| **Proof of the Dashboard rule** | a future booking must not change tonight | 05:4x UTC another agent created WBK-104 (QA28 Phone Guest, 301+201, 5-7 Dec). Legacy /api/rooms 201 AVAILABLE -> RESERVED, and Dashboard available 4 -> 3, occupancy 82.8% -> 86.2%. tonight API unchanged (15/13/1) | WRONG — confirmed: Dashboard reads legacy room_numbers.status, where RESERVED = "has any future booking" |
| Maintenance effect on Dashboard | OOO room = not available, not "occupied" | QA28 block on 303: Dashboard available 5 -> 4 and occupancy counted 303 as occupied (29-4) | WRONG (OOO counted as occupancy) |
| Dashboard Room revenue | room nights of tonight | after WBK-104 (future 5-7 Dec) was created, revenue_today.room_value 16 -> 109,766 (Reports "Room Sales BDT 108,266"). It is "room sales booked today", incl. future stays | WRONG label/rule (P1) |
| Dashboard arrivals after walk-in | arrivals list | checkins 3 -> 4 after WBK-105 (312, created + checked out same day by another agent) | OK (counts same-day) |

### UI/UX vs approved design
| Screen | Prototype (src/components/hms/dashboard.tsx) | Live | Result |
|---|---|---|---|
| Header | "Good morning, Md Yeapas" + date + New booking | "Good morning, Md" + "Saturday, Nov 28, 2026" + New Booking; extra "New property" pill in top bar | PARTLY |
| KPI row | Arriving today · Occupancy (x of y rooms) · Available rooms · Room revenue today, 4 tinted tiles | same 4 tiles, same order, same tints | MATCH (layout) / numbers wrong |
| Today's priorities card | list of to-dos (website requests, collect, clean, QR, chat, expenses, refunds…) + "Start with the first" | replaced by "Prepare arriving rooms" card (progress bar + Open housekeeping) | NO MATCH |
| Website & booking card | Published / domain chips, fees row, All themes, Manage website | same | MATCH |
| Arriving today table | Guest, Room+type, Stay, Booking chip "✓ Confirmed", Payment "Paid"/"৳x due", Open | Guest, Room (no type), Stay, Status "CONFIRMED" caps, Due "BDT 0" instead of "Paid" | PARTLY |
| Third card (plan) | Team & inventory / Restaurant today / Booking sources | not seen above the fold (not checked below arrivals) | NOT TESTED |
| Currency | ৳ | "BDT 16", "BDT 26,600" on dashboard, "৳" on Rooms/Rates | P2 mix |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| ROOM-P0-02 overdue in-house invisible | NOT FIXED | FIXED in tonight API (overdue 7) and Room numbers chip "Checkout overdue · guest still in room"; Dashboard has no overdue/departures tile (P1 below) |
| Retest C5 occupancy mismatch (25 vs 13) | open (28 Nov retest) | STILL OPEN — root cause found (legacy RESERVED status) |
| Retest "Room revenue today BDT 16" | open | STILL OPEN — rule is "room sales booked today", now 109,766 incl. a 5-7 Dec booking |
| Retest fees "Walk-in 0.01%" | open | STILL OPEN (commission_rates.walk_in 0.01) |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| B-DASH-P1-01 | Occupancy / Available rooms read legacy room status, where RESERVED means "has any future booking" | Dashboard; GET /api/dashboard/stats; compare /api/rooms room_numbers.status | Occupancy 12/29 (41%), available 16 (15 clean) | 25/29 = 82.8%, available 4 (incl. 206 occupied, 204 arriving); a 5 Dec booking dropped it to 3 / 86.2% | BE: compute both from accommodations/tonight (booked, available, ooo); OOO shown separately, not as occupancy |
| B-DASH-P1-02 | "Room revenue today" = sales booked today (incl. future stays) | create a future booking, refresh Dashboard | nightly revenue of stays covering tonight (prototype) or rename "Room sales booked today" | 16 at start, 109,766 after a 5-7 Dec booking | BE: sum allocation nightly rate for tonight; or relabel |
| B-DASH-P1-03 | "Prepare arriving rooms: 2 ready · 2 need cleaning · 2 of 4 available rooms ready" not about arrivals | Dashboard | "3 arrivals: 2 ready, 1 waiting inspection (105)" | uses housekeeping ready_rooms / needs_cleaning and the wrong "4 available"; later "1 ready · 2 need cleaning" | use arrivals x readiness of their assigned rooms |
| B-DASH-P1-04 | No overdue check-out / departures signal on Dashboard | 7 overdue in-house rooms (101,102,103,104,206,208,209), all since 25 Nov or earlier (two since Sep) | red "7 overdue check-outs" priority | nothing; today_checkins.checkouts 1 = WBK-080 (207, never checked in) | add overdue to priorities; exclude never-arrived stays |
| B-DASH-P1-05 | daily-operations room_status counts drafts and misses OOO | GET /api/dashboard/daily-operations | total 29, OOO 1 | total 46, vacant 35, out_of_order 0 | filter published; read maintenance |
| B-DASH-P2-01 | Text: status "CONFIRMED" caps; "BDT 0" instead of "Paid"; first name only; BDT vs ৳ | Dashboard | prototype copy | as described | FE copy |
| B-DASH-P2-02 | stats.total_bookings 52 while /api/bookings total 50 at the same time (later 52 after 2 new bookings — so the earlier 52 may include rows outside branch scope) | GET both | same number | 52 vs 50 | CHECK definition |

## Room / Accommodation

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Room types tab KPI: Total 29 · Available tonight 14 · Booked tonight 13 · Out of order 1 | PARTLY | tonight API {available 15, booked 13, ooo 1}. 14 = 15 minus dirty 312: dirty room is in no tile (14+13+1 = 28 of 29) |
| Banner "Rooms in use: 46 · Package limit: Unlimited" + "17 draft units not bookable yet" | OK / P2 | room_quota used_rooms 46 incl. 17 drafts (old ROOM-P1-10) |
| Type cards badges | PARTLY | 201-205 "4 of 5 available" OK (204 arriving). 206-209 "Fully booked tonight · 1 out of order" OK. 301-304 "4 of 4" OK. 401-405 "2 of 5" (404 phantom, truth 3 of 5). 501-505 "4 of 5" OK. **312 "Out of order"** while 312 is only dirty (legacy type status AVAILABLE, unit not OOO) |
| Deluxe (101-105) card | BUG | "Waiting for approval · Waiting for BinGi approval — units stay drafts until approved." /api/rooms RM-HTL000001-101 approval_status PENDING, price 16,000 (saved in 28 Nov retest). The same 5 units show as live Booked tonight on Room numbers, have 4 checked-in guests + 1 arrival, and are sold for 10 Dec (GET /api/rooms?check_in=2026-12-10 lists Deluxe). NEW-ROOM-P0-01 still open, and the "units stay drafts" text is false |
| Card titles | BUG (old) | all cards titled "Twin"/"Single" (bed type), names Premium Room / Deluxe … only in Add room type page |
| "৳20,000 with service + VAT" line | BUG (old) | VAT 0 / service 0 (rooms vat_rate 0.00, service_charge_rate 0.00) — repeats the price |
| Room numbers tab: strip 14 / 13 / Needs cleaning 2 / OOO 1 | OK | Needs cleaning 2 = 312 + 105 (waiting inspection) |
| Room numbers first paint | BUG (P2) | for ~3 s the grid shows legacy states ("206 Available", "207 Reserved", "105 Reserved", "101 Occupied") before switching to tonight states |
| Two-line chip (occupancy + readiness) | PARTLY FIXED | e.g. "204 Booked Tonight / Room clean", "101 Booked Tonight / Checkout overdue · guest still in room". But 312 shows "Not Ready · Cleaning / Needs cleaning" (occupancy line replaced by cleaning) |
| 404 chip "Booked Tonight / Guest in room" | BUG (P1) | no booking covers tonight; panel → Reservation schedule says "Unit is marked occupied, but no matching current checked-in canonical owner was found … Handoff review is incomplete" (old ROOM-P0-01 pattern, now on 404) |
| Unit panel (404) | PARTLY | Status "In use — can be sold", Tonight, Unit code, Door number, Location, Category "Twin", Price ৳41,000, Out of order form (reason + expected back), staff note, Readiness / Unit history / Reservation schedule, Edit room type. "Mark out of order" offered on a room shown "Guest in room" without warning (old ROOM-P2-01) |
| Reservation schedule panel | BUG (old ROOM-P1-09) | title "Reservation schedule · LEGACY-RN-21"; developer copy "explicit assignments", "canonical owner", "Suite · ROOM · draft · Current physical status: OCCUPIED" |
| Filters | PARTLY | Status filter still 11 raw lowercase states (available, reserved, … hold) — old ROOM-P2-02. Location filter now "Main building / Floor 1…6" (6 floors; rooms only on 1-5) |
| Draft "Tow bad room" 17 units | OK / old bugs | "No location · 17", "Draft · not bookable", numbers 102,104,106-120 — 102 and 104 duplicate published rooms (old ROOM-P1-05 still open); "Publish all drafts (17)" button present (NOT pressed) |
| Setup tab (/rooms/setup) | PARTLY | opens "Edit where your rooms are": Rooms + Apartments, Main building · Floors 6, live drawing F1-F6. Hotel has 5 floors. Not saved |
| Add room type list (/rooms/new) | BUG (old) | 8 types, all "Saved · waiting for BinGi approval" + "No photos yet" (old ROOM-P1-03, ROOM-P2-05). KPI "Lowest price ৳2,000" comes from the draft apartment |
| Edit on /rooms/new (Premium Room) | BUG (old ROOM-P1-02) | goes to /rooms/new?classic=1&category=… "Add room / accommodation · What are you adding?" step 1, nothing prefilled |
| Create QA28 room type | NOT DONE | skipped on purpose: a new type adds units to the shared property counts other agents are reconciling; approval flow evidence taken from Deluxe (PENDING) instead |
| Units API lifecycle | BUG (P2) | GET /api/accommodations/units: all 46 units lifecycle_status "draft" (incl. the 29 sold rooms); only tonight API state separates them |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Rooms tiles = tonight API | same | booked 13 / ooo 1 equal; available 14 vs 15 (dirty excluded on screen, included in API) | PARTLY — define "available" once |
| Rooms vs Dashboard | same | 13 booked vs 25 "occupied" | WRONG (see B-DASH-P1-01) |
| Overdue shown on rooms | yes | 7 rooms "Checkout overdue · guest still in room" | MATCH |
| 104 two checked-in guests | blocked | WBK-079 + WBK-077 both CHECKED_IN on 104 (old data) | OPEN data issue |
| Approval after price edit | price edit should not unpublish | Deluxe PENDING; card says units stay drafts; still sold | WRONG (NEW-ROOM-P0-01 open) |
| Duplicate door numbers | blocked | draft 102/104 = published 102/104 | WRONG (old) |
| Two types named "Suite" | unique | Suite ৳41,000 and Suite ৳60,000; also two identical "Suite" chips in the coupon scope picker | WRONG (old ROOM-P1-06) |

### UI/UX vs approved design
| Screen | Prototype (rooms/types.tsx, pages.tsx) | Live | Result |
|---|---|---|---|
| Room types | header, tabs, 4 KPI, search + filters, grid/list, photo cards named by type | same layout; titles = bed type; 2 banners; "with service + VAT" line | PARTLY |
| Room numbers | status strip, floor groups, two-line chips | same; raw status filter; legacy flash on load; 312 chip wrong | PARTLY |
| Unit panel | status, code, location, price, OOO with Release | matches; developer schedule panel | PARTLY |
| Setup | building + floors + zones | building with 6 floors, form-first | PARTLY |
| Add room type | one-page panel, Edit prefilled | list OK; Edit = 5-step add wizard | NO MATCH (edit) |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| ROOM-P0-01 booked with no guest | FIXED (25) | REGRESSED on 404 (legacy OCCUPIED, no stay) |
| ROOM-P0-02 overdue invisible | NOT FIXED | FIXED (chip + API count 7) |
| ROOM-P0-03 206 available with guest | NOT FIXED | FIXED (206 Booked tonight, overdue; not offered in New booking) |
| ROOM-P0-04 edit 422 | NOT FIXED | FIXED per retest (Deluxe 16,000 saved) — not re-saved today |
| ROOM-P0-05 OOO two sources | NOT FIXED | PARTLY: 207 OOO and not sold; but Housekeeping row still says "Room block: Sellable" and "Rooms blocked 0", Occupancy report "Blocked 0" |
| ROOM-P0-05c / P2-07 312 card "Out of order" | open | STILL OPEN |
| NEW-ROOM-P0-01 price edit -> PENDING | open (28 retest) | STILL OPEN (approval_status PENDING) |
| ROOM-P1-01 titles by bed type | open | STILL OPEN |
| ROOM-P1-02 Edit opens add wizard | open | STILL OPEN |
| ROOM-P1-03 waiting approval on live types | open | STILL OPEN (all 8) |
| ROOM-P1-04 "with service + VAT" same price | open | STILL OPEN |
| ROOM-P1-05 duplicate door numbers | open | STILL OPEN |
| ROOM-P1-06 two "Suite" | open | STILL OPEN |
| ROOM-P1-07 merged chip | open | MOSTLY FIXED (312 still merged) |
| ROOM-P1-08 floors mismatch | open | PARTLY (Setup 6 floors, Rooms 5, HK filter ghost floors) |
| ROOM-P1-09 developer schedule copy | open | STILL OPEN |
| ROOM-P1-10 rooms in use 46 | open | STILL OPEN |
| ROOM-P2-01 OOO on occupied room | open | STILL OPEN |
| ROOM-P2-02 raw status filter | open | STILL OPEN |
| ROOM-P2-03 available 19 vs 22 definition | open | STILL OPEN (14 vs 15) |
| ROOM-P2-05 "No photos yet" | open | STILL OPEN |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| B-ROOM-P0-01 | Deluxe (101-105) still PENDING after the price edit; card says "units stay drafts" but the type is sold | Rooms > Room types; /api/rooms RM-HTL000001-101 | price change keeps type live; no approval or approval does not unpublish | approval_status PENDING; tonight API sells/holds 101-105; /api/rooms?check_in=2026-12-10 offers Deluxe; New booking 29 Nov offers 105 | approve in Super Admin now; BE: price edits must not reset approval |
| B-ROOM-P1-01 | Phantom "Booked tonight / Guest in room" on 404 | Room numbers > 404 > Reservation schedule | Available (no stay covers tonight) | booked/occupied from legacy OCCUPIED (WBK-100 CONFIRMED 24-25 never checked in) | derive from stays only; auto no-show stale CONFIRMED; release button |
| B-ROOM-P1-02 | Card "Out of order" on Standard Room (312) | Room types | "Needs cleaning" or availability badge | "Out of order" | use tonight ooo field for the badge |
| B-ROOM-P1-03 | Stale CONFIRMED stays never closed (9 allocations with check_out <= today) keep legacy RESERVED | /api/bookings | no-show / expired after check-out date | WBK-080, 081, 087, 088, 098, 100, 101 … still CONFIRMED | night audit: mark no-show |
| B-ROOM-P2-01 | Legacy states flash on Room numbers load (~3 s) | open Room numbers | skeleton | wrong states (206 Available, 207 Reserved) | render after tonight API |
| B-ROOM-P2-02 | Dirty room in no KPI tile (14+13+1 = 28 of 29) | Room types KPI | 4 tiles add up or show "Needs cleaning" | 312 missing | add tile or count dirty in available with note |
| B-ROOM-P2-03 | Units API lifecycle "draft" for all 46 | GET /api/accommodations/units | published units "published" | all draft | data migration |
| B-ROOM-P2-04 | Setup shows 6 floors; hotel uses 5 | Rooms > Setup | 5 | 6 (F6 empty) | — |

## Housekeeping

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Tasks KPIs Pending 1 · Cleaning 0 · Awaiting inspection 1 · Ready rooms 4 | PARTLY | GET /api/housekeeping/tasks 14 tasks (12 Done, 105 Awaiting Inspection, 312 Pending). "Ready rooms 4" vs Rooms "Available tonight 14" vs Dashboard ready_rooms 2 → three "ready" numbers (old HK-P1-03 open) |
| Banner "Guest arriving, room not ready: 105" | OK | 105 = WBK-103 arrival, task Awaiting inspection |
| Team now | OK | Md Yeapas "Next: 312", QA28 Staff One "Free" (staff created by another agent) |
| Start cleaning 312 | OK | toast "Room 312 · cleaning started"; card "Cleaning · Started 11:34 AM" (old HK-P2-01 "Picked up + Not started" FIXED) |
| Checklist 8/8 + Submit for inspection | OK | "Room 312 · sent for inspection"; Awaiting inspection 2 |
| Approve inspection | OK | task removed from active; tonight API 312 housekeeping "clean"; legacy /api/rooms 312 AVAILABLE; Dashboard available 4 -> 5 |
| Inspection: send back option | MISSING (P2) | only "Close" and "Approve inspection"; prototype has "What needs fixing?" send-back |
| Self-inspection | RISK (P2) | same user cleaned and approved (no separation) |
| Task links booking | OK | 312 task shows "Booking WBK-2026-000083" |
| Floors filter | BUG (old HK-P1-02) | 10th, 1st, 20th, 2nd, 3rd, 40th, 96th Floor; 4th and 5th missing |
| Ghost task rooms | BUG (P2) | tasks for rooms 4002, 9601, 1001, 2004 (Done) — not real door numbers |
| Maintenance list | PARTLY | 207 "ggg" Urgent Open "Overdue Nov 09" — row says "Room block: ● Sellable" and "Rooms blocked 0" while tonight API / Rooms say 207 OOO and New booking hides it |
| Add maintenance QA28 on 303 with block | OK | mnt_gr9ulnplz9 created; Rooms blocked 1; tonight API {available 14, booked 13, ooo 2}, 303 state ooo/maintenance OUT_OF_ORDER; /api/rooms?check_in=28 and 10 Dec: 303 OUT_OF_ORDER; New booking tonight: Executive Suite "3 of 4 free" (301,304,302), 303 gone |
| Maintenance detail | OK | separate tiles Room status "Maintenance" · Cleanliness "Ready" · Availability "Out of order" (good separation); activity log |
| Start work → Mark fixed | OK / P2 | "What was done?*" required; "Put the room back in service" is UNCHECKED by default (easy to leave room OOO after fix); "Create a cleaning task" option |
| After fix | OK | tonight back to 15/13/1; 303 available/clean; /api/rooms 303 AVAILABLE; New booking 29 Nov lists 303 |
| Toggle copy | P2 | form: "Off = out of service: still not sold until fixed, but not reported as broken" but list column calls that state "Sellable" |
| Checklist tab | OK | template per type (Check-out / Stay-over / Custom), 8 required items, Inspection required toggle, Save/Discard (not saved) |
| Dev IDs to staff | P2 (old HK-P2-02) | "mnt_gr9ulnplz9", "tsk_…" visible |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Readiness vs booking vs maintenance separate | 3 fields | maintenance detail shows 3 tiles; Room numbers two lines; tonight API state + housekeeping + maintenance | MATCH (mostly) |
| Block → not sellable everywhere | gone from New booking + tonight | yes for 303 | MATCH |
| Close → returns | back in tonight + New booking | yes | MATCH |
| 207 block flag vs availability | one truth | list "Sellable"/blocked 0 vs tonight ooo | WRONG |
| Ready count definitions | one definition | HK 4, Dashboard 2→1, Rooms 14, Occupancy report "Ready and unreserved 2" | WRONG |
| OOO counted on Dashboard | separate | counted as occupied | WRONG |

### UI/UX vs approved design
| Screen | Prototype (housekeeping/page.tsx) | Live | Result |
|---|---|---|---|
| Tasks | 4-status strip, Team now, search+staff filter, cards/list, History | same + floor filter | MATCH |
| Task drawer | steps Assigned→Cleaning→Inspection→Ready, checklist, Activity, send back | same, no send back | PARTLY |
| Maintenance | table with block toggle + "Mark fixed" | table with Open/Start, block shown as text; Unit maintenance button | PARTLY |
| Checklist | template editor + Inspection required | same | MATCH |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| HK-P0-01 OOO two places | NOT FIXED | PARTLY (availability OK; block flag/labels still disagree for 207) |
| HK-P1-01 overdue maintenance not flagged | open | PARTLY (row "Overdue Nov 09" in bold; no count/Dashboard alert) |
| HK-P1-02 ghost floors | open | STILL OPEN |
| HK-P1-03 ready numbers differ | open | STILL OPEN |
| HK-P2-01 Picked up + Not started | open | FIXED |
| HK-P2-02 dev IDs | open | STILL OPEN |
| HK-P2-03 "ggg" accepted | open | STILL OPEN (free text) |
| HK-P2-04 overdue task no reminder | open | STILL OPEN ("Overdue · 1:50 PM" only) |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| B-HK-P1-01 | 207 OOO but list says "Sellable", "Rooms blocked 0"; Occupancy report "Blocked units now 0" | Housekeeping > Maintenance; Reports > Occupancy | one OOO truth with Release | conflicting labels | read availability_status OUT_OF_ORDER for the block column/counters |
| B-HK-P1-02 | Four "ready" numbers | HK / Dashboard / Rooms / Occupancy report | one definition | 4 / 2 / 14 / 2 | shared BE field "ready_to_sell" |
| B-HK-P2-01 | "Put the room back in service" unchecked by default on Mark fixed | Maintenance > Mark fixed | checked by default (or ask) | unchecked | default on |
| B-HK-P2-02 | No send-back in inspection | Inspect | Approve / Send back with reason | Approve only | add |
| B-HK-P2-03 | Ghost task rooms 4002, 9601, 1001, 2004 and ghost floors | Tasks / History | real units only | present | clean test data, validate unit FK |

## Discounts & Rates

### Screens & functions tested
| Screen/function | Result | Evidence |
|---|---|---|
| Rates & Availability calendar (Easy · by type) | OK layout | type list with base + tonight price + "tonight x of y left"; month grid with nightly ৳; default prices panel (Base, Fri-Sat); month stats |
| "tonight x of y left" | BUG (P1) | Deluxe "1 of 5 left" (truth 0: 4 overdue + 105 arriving; tonight API all 5 booked). Premium Deluxe "4 of 4 left" (truth 0: 207 OOO + 206/208/209 overdue). Suite 41k "3 of 5" (= truth, but Rooms says 2). Ignores overdue in-house and OOO |
| Month stats Deluxe | CHECK (P2) | "Room-nights left 11" but "If every room sells ৳2,40,000" = 15 nights × 16,000 (11 × 16,000 = 1,76,000) |
| Tow bad room in list | P2 | "Apartment · 0 rooms · base ৳2,000" — 17 draft units shown as 0 rooms |
| Calendar sync tab | NOT TESTED | time |
| Discounts tab | OK | Active 0 / Scheduled 0 / All 1 / Times used 0; old "werwer" coupon Expired |
| New campaign form | OK | Automatic deal / Coupon code; Name EN + নাম (বাংলা); code + Generate; Percentage / Fixed ৳; live preview "Standard Room: ৳5,555 → ৳5,545 a night"; Applies to All / Room types; Starts/Ends/Use limit; Save draft / Publish |
| Create QA28 coupon | OK | "QA28 coupon test", code QA28TEST, ৳10 off per night, Standard Room only, 28-30 Nov, use limit 1 → Active |
| Coupon in New booking — wrong room | OK | 303 Executive Suite 28-29 Nov: "Coupon does not apply to the selected room." |
| Coupon in New booking — right room | OK | 312 Standard 29-30 Nov, 1 adult: Rooms ৳5,555, "Coupon QA28TEST −৳10", Total ৳5,545 (= 5,555 − 10). Direct discount then locked: "A coupon or offer already reduces this stay…". Booking NOT confirmed |
| Pause coupon | OK | "QA28 coupon test paused", Active 0, Paused 1. Re-apply after pause NOT re-tested |
| Scope picker | P1 (old ROOM-P1-06) | two identical "Suite" chips; draft type absent |
| New booking capacity | OK | 312 (max 1) with 2 adults → "Too many guests for this choice (max 1)" |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Coupon math | 5,555 − 10 | 5,545 | MATCH |
| Coupon scope | only Standard Room | rejected on Executive Suite | MATCH |
| Coupon + direct discount stacking | blocked | blocked with message | MATCH |
| Calendar availability = tonight API | same | Deluxe 1 vs 0, Premium Deluxe 4 vs 0 | WRONG |
| Future-date availability (NEW-BKG-P0-01) | loads | GET /api/rooms?check_in=2026-12-10 200 in 1.27 s; New booking 29 Nov lists rooms | FIXED (load); 405 correctly excluded for 29 Nov (WBK-096) |
| Meals label | real meal plan | every type "Breakfast + Lunch + Dinner included" (retest P1) | STILL OPEN |

### UI/UX vs approved design
| Screen | Prototype (rates/pages.tsx) | Live | Result |
|---|---|---|---|
| Rates page | "Rates & Discounts", one calendar | "Discounts & Rates" with tabs Rates & Availability / Calendar sync / Discounts; Easy/Advanced | PARTLY (more tabs, same idea) |
| Campaign sheet | "New campaign · Set up an offer to fill rooms." | same title/sub, same fields | MATCH |
| Campaign cards | status tabs + cards | All / Active / Scheduled / Paused / Expired / Draft + cards with Pause/Edit/Delete | MATCH |

### Old issues status
No earlier Discounts QA file exists (03/04 notes do not cover it) — first audit.

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| B-RATE-P1-01 | "tonight x of y left" ignores overdue in-house and OOO | Discounts & Rates, type list | Deluxe 0 of 5, Premium Deluxe 0 of 4 | 1 of 5, 4 of 4 | use tonight API |
| B-RATE-P2-01 | Month stats "If every room sells ৳2,40,000" vs "Room-nights left 11" | Deluxe stats | same basis | 15 vs 11 nights | label or compute on left nights |
| B-RATE-P2-02 | Draft apartment shows "0 rooms" | type list | "17 draft" | 0 rooms | — |

## Cross-module logic (one moment, ~05:43 UTC 28 Nov)
| Source | Occupied/booked | Available | OOO | Ready |
|---|---|---|---|---|
| Truth (bookings + allocations) | 12 rooms (7 overdue in-house + 105, 204, 401, 402, 502) | 16 (incl. dirty) | 1 (207) | — |
| accommodations/tonight | 13 (+404 phantom) | 15 | 1 | — |
| Rooms page | 13 | 14 (dirty excluded) | 1 | — |
| Dashboard | 26 of 29 "occupied" (86.2%) | 3 | counted as occupied | 1 ready / 2 need cleaning |
| daily-operations | occupied 7 of 46 | vacant 35 | 0 | — |
| Housekeeping | — | — | Rooms blocked 0 | Ready rooms 4 |
| Occupancy report | in-house 3 | ready & unreserved 2 | blocked 0 | — |
| Rate calendar | — | Deluxe 1/5, P.Deluxe 4/4 | ignored | — |

Seven screens, seven definitions. Only tonight API / Rooms / New booking agree (except 404).

## Test data created
| Record | Detail | State now |
|---|---|---|
| Housekeeping task tsk_ltcnnlgz (existing, room 312) | started 11:34, checklist 8/8, approved | Done; 312 clean (later another agent's WBK-105 checked out 312 → dirty again) |
| Maintenance mnt_gr9ulnplz9 "QA28 AC test (please ignore)" room 303, block on | Start work → Mark fixed "QA28 test closed", back in service | Resolved; 303 available |
| Campaign "QA28 coupon test" code QA28TEST, ৳10/night, Standard Room, 28-30 Nov, limit 1 | applied in a New booking quote only (not confirmed) | Paused, used 0 |
| New booking draft 312 29-30 Nov QA Guest 10 | not confirmed | nothing saved |
No prices, VAT, room types or settings changed. No room type created.

## Not tested (why)
- Creating a QA28 room type + Super Admin approval: would add units to shared counts during parallel reconciliation; Super Admin out of scope.
- Room type Edit drawer save: brief says don't change prices; retest already saved Deluxe.
- Publish all drafts, Export CSV, Setup save: would change shared data.
- Calendar sync tab, Advanced rate view, setting a custom nightly price: changes shared prices.
- Coupon re-apply after Pause (quote): time.
- Narrow width layout and staff (housekeeper) role.
- Dashboard third card below the arrivals list.
