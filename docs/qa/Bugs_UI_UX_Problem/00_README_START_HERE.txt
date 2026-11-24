================================================================
 BinGi HMS  -  Bugs / UI / UX Problems  (live QA, 24 Nov 2026)
 START HERE
================================================================
 Site tested:  https://hms.bingi.app  (TESTING server)
 API:          https://api.bingi.app/api/*
 Property:     Pan Pacific Sonargaon Dhaka (account "Md Yeapas")
               + "QA Test Resort" / "QA Test Hotel" for onboarding
 Device:       Desktop Chrome 1568 px, Hotel admin role
 Compared to:  BinGi HMS prototype = approved design
               (repo bingi-web-theme-, branch main)
 Branch:       qa/live-hms-onboarding-2026-11-24
 Folder:       docs/qa/Bugs_UI_UX_Problem/
 Full reports: docs/qa/BinGi_HMS_*_QA_2026-11-24.txt (long versions)
 Design refs:  docs/qa/design-ref-bookings | -rooms | -operations


----------------------------------------------------------------
 FILES IN THIS FOLDER
----------------------------------------------------------------
  00_README_START_HERE.txt ............ this file (summary + order)
  01_Onboarding.txt ................... sign-up -> plan -> rooms -> submit
  02_Bookings.txt ..................... list, new booking, booking page,
                                        calendar, room board
  03_Rooms_Accommodation.txt .......... room types, room numbers, setup
  04_Housekeeping.txt ................. tasks, maintenance, room blocks
  05_Meals_Restaurant_Bar.txt ......... POS, kitchen, guest QR, settings
  06_Inventory.txt .................... stock, PO, receive, recipes
  07_Other_Services.txt ............... services, orders, board
  08_Operations_Expenses.txt .......... expenses, bills, approval
  09_Money_Cashbox_Payments_
     Finance_Reports.txt .............. money check across modules
  10_Global_UI_UX.txt ................. problems seen in many modules
  99_Checklist_All_Issues.txt ......... every ID on one line, tick box


----------------------------------------------------------------
 HOW TO READ
----------------------------------------------------------------
  P0 = blocker, money risk, double booking. FIX FIRST.
  P1 = wrong, risky, or different from approved design.
  P2 = polish.
  Every item:  [ID] title
                 WHERE    screen / API
                 HAPPENS  what I saw (with real numbers / IDs)
                 IMPACT   why it matters for the hotel
                 EXPECTED what our design / rule says
                 FIX      BE = backend, FE = frontend
  IDs: ONB BKG ROOM HK MEAL INV SRV EXP MON GLB  +  -P0/-P1/-P2-nn
  "WORKS - KEEP" in each file = do NOT change these.


----------------------------------------------------------------
 COUNT
----------------------------------------------------------------
  File                                  P0    P1    P2   Total
  ------------------------------------  ----  ----  ----  -----
  01 Onboarding                           5    18    18     41
  02 Bookings                             4    17    22     43
  03 Room / Accommodation                 5    10     9     24
  04 Housekeeping                         1*    3     4      8
  05 Meals (Restaurant & Bar)             3     7    18     28
  06 Inventory                            0     7    17     24
  07 Other Services                       0     7    16     23
  08 Operations (Expenses)                5     9     7     21
  09 Money (Cashbox/Payments/Finance)     3*    6     5     14
  10 Global UI / UX                       0     8    10     18
  ------------------------------------  ----  ----  ----  -----
  TOTAL                                  26    92   126    244
  * HK-P0-01 = ROOM-P0-05, MON-P0-02 = EXP-P0-05,
    MON-P0-03 = EXP-P0-02 + EXP-P0-04  ->  23 different P0 problems.


----------------------------------------------------------------
 SYSTEM MAP  -  where the P0 problems sit
----------------------------------------------------------------

   OWNER SIGN-UP
   +-----------------------------+
   | ONBOARDING                  |  ONB-P0-01/02 continue -> wrong hotel
   |  plan -> checkout -> rooms  |  ONB-P0-03 only 1 room type (KYC 403)
   +--------------+--------------+  ONB-P0-04/05 wrong plan, KYC blocks pay
                  |
                  v
   +-----------------------------+      +-----------------------------+
   | ROOMS (room types/numbers)  |<---->| HOUSEKEEPING (OOO, cleaning)|
   |  ROOM-P0-01..03 wrong state |      |  HK-P0-01 OOO two sources   |
   |  ROOM-P0-04 cannot edit     |      +-----------------------------+
   |  ROOM-P0-05 OOO two sources |
   +--------------+--------------+
                  | availability
                  v
   +-----------------------------+      +-----------------------------+
   | BOOKINGS                    |----->| MEALS / SERVICES (charges)  |
   |  BKG-P0-01 occupied re-sold |      |  MEAL-P0-01 settings 422    |
   |  BKG-P0-02 email required   |      |  MEAL-P0-02 QR ignores pause|
   |  BKG-P0-03 board != bookings|      |  MEAL-P0-03 QR payment 500  |
   |  BKG-P0-04 move room broken |      +--------------+--------------+
   +--------------+--------------+                     |
                  | payments                           |
                  v                                    v
   +----------------------------------------------------------------+
   | MONEY: CASHBOX  |  PAYMENTS  |  FINANCE  |  REPORTS            |
   |  MON-P0-01 desk cash posted as BinGi payable -> payout possible|
   |  MON-P0-03 Cashbox != drawer after expenses                    |
   +----------------------------------------------------------------+
                  ^
                  | cash out
   +-----------------------------+
   | OPERATIONS (EXPENSES)       |  EXP-P0-01 approval bypass via API
   |                             |  EXP-P0-02 cash payment not posted
   |                             |  EXP-P0-03 status "Paid" skips approval
   |                             |  EXP-P0-04 reject paid -> cash back
   |                             |  EXP-P0-05 "Net Profit" = booked value
   +-----------------------------+


----------------------------------------------------------------
 5 ROOT CAUSES  (fix these, many items close together)
----------------------------------------------------------------
  R1  Room state in TWO places (legacy rooms table vs accommodations
      engine) -> wrong Booked / Available / OOO everywhere.
      Closes: ROOM-P0-01..03, ROOM-P0-05, HK-P0-01, BKG-P0-01, BKG-P0-03,
      BKG-P0-04, BKG-P1-05, BKG-P1-17, ROOM-P1-07/08.
  R2  No overdue check-out / no night audit -> in-house stays never
      end, past bookings never no-show.
      Closes: ROOM-P0-02, BKG-P1-03, BKG-P1-05, BKG-P1-15, BKG-P1-14.
  R3  Rules only in the UI (approval, pause, plan, KYC) -> API ignores
      them. Closes: EXP-P0-01, MEAL-P0-02, ONB-P0-04, GLB-P1-07.
  R4  Status changes move money (expense dropdown) and money posts by
      channel are wrong (Finance takes desk cash).
      Closes: EXP-P0-02..04, MON-P0-01, MON-P0-03.
  R5  Validation lists FE vs BE out of sync / API errors hidden.
      Closes: ROOM-P0-04 (bed/amenity enum), MEAL-P0-01 (qr_logo),
      BKG-P0-02 (email), ONB-P0-03 message, GLB-P1-02/03.


----------------------------------------------------------------
 SUGGESTED FIX ORDER  (sprints)
----------------------------------------------------------------
  SPRINT 1 - money + double booking (stop real loss)
    MON-P0-01  Finance only for BinGi gateway / marketplace money
    EXP-P0-01..04  approval + payment + Cashbox in one locked flow
    R1 + R2    one room-state source, overdue check-out
               (ROOM-P0-01..03/05, HK-P0-01, BKG-P0-01/03/04)

  SPRINT 2 - blocked flows
    ONB-P0-03/05  KYC rules (founder decisions D2, D3)
    ONB-P0-01/02/04  session, retry, checkout plan id
    ROOM-P0-04  room type save
    MEAL-P0-01/02/03  settings save, QR pause/approval, QR payment
    BKG-P0-02  email rule
    EXP-P0-05 / MON-P0-02  "Left after costs" from received money

  SPRINT 3 - P1 (wrong / different from design)
    Per module "FIX ORDER" at the end of each file.
    GLB-P1-01 names (Sidebar v7) + GLB-P1-02/03 errors & plain text.

  SPRINT 4 - design 1:1 + P2
    02_Bookings DESIGN D1-D5, 03_Rooms section E, 08_Operations
    section E, then P2 lists + 10_Global P2.

  After each sprint: re-test on hms.bingi.app and tick
  99_Checklist_All_Issues.txt.


----------------------------------------------------------------
 OPEN QUESTIONS FOR THE FOUNDER  (decide before building)
----------------------------------------------------------------
  Q1  Revenue basis in Reports: nights stayed vs bookings made
      (MON-P1-03).
  Q2  Trial length: 30 days in product vs 7 days in ads (ONB-P2-08).
  Q3  Unit code format across blocks, e.g. "Z1-C1" (ONB-P1-09).
  Q4  "Rooms in use" for billing: count drafts or not (ROOM-P1-10).
  Q5  Can guests request services from Guest App / website today?
      (SRV-P1-07 "New requests" column).


----------------------------------------------------------------
 NOT TESTED YET  (whole HMS)
----------------------------------------------------------------
  Phone / tablet layout | staff (non-admin) roles - approvals, limits,
  dropdowns | night audit / day close | group booking, waitlist |
  online bookings arriving (website, marketplace, app) | online gateway
  payments (EPS / SSLCommerz, real money - not clicked) | payout request
  | Super Admin refund | Dashboard, Guests, Chat, Staff/HR, Discounts,
  Payments page in detail, Finance statement, Reports export,
  Messaging, Website, Settings, Plan & Billing.


----------------------------------------------------------------
 TEST DATA LEFT ON THE TESTING SERVER  (clean after fixes)
----------------------------------------------------------------
  Bookings   WBK-2026-000079 (room 104, in house) + WBK-2026-000080
             ... 000099 ("QA Guest 01-20", 01700000101-120, qa01-20@
             example.com). In house: #11 (103). Cancelled #13 (refund
             10,000 pending), #14 (no-show).
  Meals      "QA Fried Rice"; OFO-2026-000012/13; FO-2026-000071.
  Inventory  store "QA Kitchen", item "QA Rice", supplier "QA Fresh
             Supply", PO-0001, CNT-0001, recipe, SALE-0001, GRN-0001.
  Services   "QA Transport", "QA Car 1", "QA Spa Partner", "QA Airport
             Pickup", OSO-GIBQD2W45S.
  Expenses   EXP-2026-000005 ... 000011, categories QA Utilities /
             QA Repairs / qa utilities, payee PAYEE-2026-000004,
             approval rule 5,000 (was Off - set 0 if not wanted).
  Onboarding "QA Test Resort", "QA Test Hotel" (not submitted).
  Cashbox    CB-2026-000020 open (24 Nov), 2,71,298 test money, day
             NOT closed.
  Nothing was paid with real money. No Terms accepted, no NID
  uploaded, no gateway clicked.
================================================================
