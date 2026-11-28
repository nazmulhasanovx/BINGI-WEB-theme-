# E — Staff/HRM, Website, Communication, Settings, Global UI — module audit 28 Nov 2026

Tester: agent E · live https://hms.bingi.app · owner Md Yeapas · HTL-000001 Pan Pacific Sonargaon Dhaka · plan `PLAN_BINGI_GROWTH` (shown as "BinGi Growth · active") · desktop 1568×741.

## Summary
- Works: Team & HR core flows (add staff, mark attendance, prepare payroll draft run 1 = ৳1,35,000), Website module structure matches prototype 1:1, Communication Center 6 tabs + delivery report, Settings 17 pages load, notifications, Ctrl+K, Flat/Expandable, mobile layouts.
- Worst: (1) **E-COM-P0-01** messages charged (Comm ৳23.10, Finance Tk 37.80 deducted) while plan says free plan credits are used first (951/1,000 email, 73/100 SMS left). (2) Staff added WITHOUT login becomes an **active HMS user** (Users & roles) and shows "Account access Active". (3) Easy/Full HR is a per-browser toggle — founder decision was plan-based (Business = Team, Ultra = Full HR). (4) Comm cost ≠ Finance cost; Settings "30 of 39 messages on" ≠ Comm "44 on". (5) 216 never-expired sessions; activity log misses staff creation.
- Also: phone "123" saved for staff; no per-user Bangla switch (header EN only links to preferences; language only property-wide); 7 of 9 sidebar names still old; mixed money/date formats; slow 5–10 s pages; dark drawers; "Plan not selected" flicker still there.
- Website: dashboard says "Published" but website booking is **Paused**; website booking fee 1% shown only on dashboard card, not in Website module; walk-in 0.01% commission needs confirmation.
- Counts (bug IDs): **P0 ×1 · P1 ×18 · P2 ×33** (E-HR 4/8 · E-WEB 4/5 · E-COM P0 1 + 3/4 · E-SET 4/8 · E-GLB 3/8, as P1/P2).

---

## 1. Staff / Team & HR

### Screens & functions tested
| Screen / function | Result | Evidence |
|---|---|---|
| Sidebar "Staff" → page title "Team & HR" | BUG (P2) | Sidebar/breadcrumb say "Staff", H1 says "Team & HR". v7 name = "Team" (Business) / "Team & HR" (Ultra). |
| Easy / Full HR switch (header radio) | BUG (P1, plan decision) | Radio "Easy · Full HR" in header. Stored only in browser `localStorage['bingi.staff.mode']` (`easy`/`full`), not plan or server. Founder decision 23 Nov: no switch — Business = Team list, Ultra = Full HR. |
| Easy mode view | PARTLY | Shows People 2 / Departments 0 / Not working 0, list with phone + call button, note "Switch to Full HR at the top". But the Full HR tab bar (Overview/People/Attendance/Schedule/More) is still shown in Easy mode; on a Full HR page it shows banner "This is a Full HR page. Easy mode only shows your team list. Back to Team / Stay in Full HR". |
| Overview (Today) | OK | Total staff 1→2, Present, On leave, Needs attention, Today's duty empty state, People updates, Pending approvals (6 counters), Attendance method Manual, Recent activity. |
| People list | OK / BUG | `GET hrm/people 200`. Employee ID column shows raw `usr_136`, `usr_179` (no employee code; `employee_code:null`). |
| Add staff — empty submit | OK | Inline errors: "Full name is required.", "Phone number is required.", "Email address is required.", "Basic salary is required." (no scroll-to-first-error; user at bottom sees only salary error). |
| Add staff — phone "123" | BUG (P1) | `POST staff 201`, toast "Staff member added." Saved `phone:"123"` (API). BD mobile rule (11 digits, 01…) not enforced in UI or backend. |
| Add staff — Department select | BUG (P2) | Dropdown empty (no departments exist), no "Add department" shortcut; Staff role list: Accountant / Front Office / Housekeeping only. |
| Add staff — Email required | P2 | Email is mandatory even with "Create a login account" unchecked; many hotel staff have no email. |
| Account access column | BUG (P1) | QA28 staff created WITHOUT "Create a login account" shows Account access **Active** (`access_status:"active"`), and HR Access page counts "Active 2". Misleading. |
| Joining date blank | P2 | Saved `joined_on:null`, accepted. |
| Attendance → Daily → Mark (QA28) | OK | Drawer: Present/Half day/Absent/Day off, check-in 08:00. `PUT hrm/attendance 200` (sent **twice** for one click), toast "Saved for QA28 Staff One", counters 1→2 present, 1→0 not marked. |
| Attendance Corrections / History | NOT TESTED in depth (tabs present). |
| Schedule (weekly roster) | OK (empty) | "No roster for 23 – 29 Nov 2026 · Create a shift first" + Create shift. Header primary button "Publish roster" is enabled although there is no roster. |
| Leave | OK (empty) | Requests/Balances/Calendar & holidays; All/Pending/Approved/Rejected/Cancelled (0); "Leave types", "Add leave". |
| Payroll → Prepare payroll (Nov 2026) | OK (draft) | `POST hrm/payroll/runs 201` → run id 1, `status:draft, payment_status:unpaid, staff_count 2, gross 135000, net 135000, due 135000, accounts_enabled:false`. 4-step Prepare→Review→Approve→Payment. NOT paid. |
| Payroll → expense link | NOT VERIFIED (by rule, not paid) | Draft is not posted anywhere (`accounts_enabled:false`). Drawer text says "A salary already paid in Operations is imported as paid and never posted again" → payroll payment should create an Expense; could not verify without paying. |
| More menu | OK | Leave, Payroll & Benefits, Hiring, Team Operations, Reports & Settings. The active "More" item replaces the "More" label (e.g. "Payroll & Benefits ▾"). |
| Reports & Settings → Settings | OK | Organization, Access, Attendance, Leave, Payroll, Approvals, Notifications, Duty coverage, Audit. Attendance: Machine (ZKT) / Manual / No attendance, Work start, Late grace 0–240. "Review changes" disabled until edit. |
| Departments | OK (empty) | "No departments yet · Add department". |
| Designations | NOT FOUND | No designation list; only free "Position"/`job_title` + Staff role. |
| Roles & permissions (Access) | OK / P2 | Roles Accountant 5, Front Office 5, Housekeeping 3 permissions; "Manage roles". Note "Salary values need the Expenses permission" (uses new name). |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Payroll gross = sum of salaries | 1,20,000 + 15,000 | 1,35,000 | OK |
| Staff added 28 Nov (no joining date) in Nov payroll | Pro-rated or flagged (joined 28 Nov) | Full 15,000 for November, no warning | BUG P1 |
| Attendance affects payroll | Half day / absence → deduction rule or note | Md Yeapas "Half day" today, deductions 0 (no rule configured; acceptable but not explained) | INFO |
| Present count | Present incl. half day | Overview "Present 1" when only status was Half day | OK (define in tooltip) |
| Draft payroll not in Expenses/Finance | Not posted | `accounts_enabled:false`, paid 0 | OK |
| Login access vs staff record | Only staff with a login = Active access | Staff without login = Active | BUG P1 |
| HR availability by plan | Business = Team list, Ultra = Full HR (founder 23 Nov) | Growth plan, both modes available via user toggle | NO MATCH |

### UI/UX vs approved design (prototype `src/components/hms/staff/*`)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Plan gate | `plan.tsx` HrmGate: `can(h,"hrm")` → Full HR else `EasyTeam` / PlanGate "Full HR" upsell. No user switch. | Easy/Full HR radio per browser | NO MATCH |
| Tabs | Today · People · Attendance · Schedule · Leave · Payroll + "Tools" menu (Hiring, Team operations, Department views, HR settings & reports) | Overview · People · Attendance · Schedule · More (Leave, Payroll & Benefits, Hiring, Team Operations, Reports & Settings) | PARTLY (Leave/Payroll hidden in More; no Department views) |
| Header actions | Tools ▾, ⋯ (Export CSV) | Easy/Full HR, Settings, primary action, ⋯ | PARTLY |
| Add staff | right drawer, light | right drawer with **dark backdrop** (design rule: no dark overlays) | PARTLY |
| Payroll run | run page with steps | 4-step run page, Payslip / Payment history / Recalculate | MATCH |

### Old issues status
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| GLB-P1-01 name "Staff" → "Team" | open | STILL OPEN (sidebar "Staff", H1 "Team & HR") |
| GLB-P2-10 weak phone validation | open | STILL OPEN (phone "123" saved) |
| GLB-P2-03 drawer dark backdrop | open | STILL OPEN (Add staff / Mark attendance / Prepare payroll drawers dim the page) |
| GLB-P2-05 readable numbers | open | STILL OPEN (`usr_179` as employee ID) |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| E-HR-P1-01 | Easy/Full HR is a per-browser toggle, not plan-based | Staff → header Easy / Full HR | Business → Team list only; Ultra → Full HR; no switch (23 Nov decision) | Any user flips mode; saved in localStorage `bingi.staff.mode` | Remove radio; derive from subscription feature `hrm`; show PlanGate upsell on Business |
| E-HR-P1-02 | Phone "123" accepted | Add staff, Mobile 123, fill rest, Add staff | Error "Enter an 11-digit mobile starting 01" (UI + API 422) | `POST staff 201`, phone "123" saved | Validate in FE + backend request rule |
| E-HR-P1-03 | Account access "Active" for staff without login | Add staff with "Create a login account" unchecked | Access "No login" | People list + Access page show Active (2) | Return `access_status:"none"` when no user login |
| E-HR-P1-04 | Payroll ignores joining date | Add staff today w/o joining date → Prepare Nov payroll | Ask joining date / pro-rate / flag | Full month 15,000 | Require joining date; pro-rate or warn on lines |
| E-HR-P2-01 | Employee ID shows `usr_179` | People list | Readable code e.g. EMP-0002 | `employee_code:null`, shows usr_ id | Auto-generate employee code |
| E-HR-P2-02 | Easy mode still shows Full-HR tab bar | Switch Easy | Only Team list | Tabs Overview/People/Attendance/Schedule/More visible | Hide tab bar in Team mode |
| E-HR-P2-03 | Department dropdown empty without help | Add staff → Department | "No departments — Add department" link | empty select | Inline create |
| E-HR-P2-04 | Mark attendance sends 2 PUTs | Attendance → Mark → Save | 1 request | `PUT hrm/attendance 200` ×2 | Guard double submit |
| E-HR-P2-05 | "Publish roster" enabled with no roster | Schedule | Disabled until roster exists | Enabled | Disable |
| E-HR-P2-06 | Old module name in payroll text | Prepare payroll drawer | "paid in Expenses" | "A salary already paid in Operations…" | Rename |
| E-HR-P2-07 | Money format mixed in payroll | Payroll run | ৳1,35,000 everywhere | "1,35,000" big, "Gross 135000 · Deductions 0" small, column "(BDT)" | One formatter |
| E-HR-P2-08 | Breadcrumb "Staff › Details" on payroll run | open run 1 | "Team › Payroll › November 2026" | "Staff > Details" | Route-based crumbs |

---

## 2. Website Management (`/dashboard/public-website` → redirects to `/dashboard/website/overview`)

### Screens & functions tested (view only, nothing published)
| Screen / function | Result | Evidence |
|---|---|---|
| Left sub-nav | OK | Overview · Design (Theme & Style, Homepage, Pages & Menu, Photos) · Content (Rooms, Services & Dining, Offers, Reviews, Contact & Policies) · Bookings (Booking Engine, Inquiries) · Settings (Google & Sharing, Domain, Languages, Online On/Off) · Publish — identical to prototype `WM_PAGES`. |
| Main sidebar active state | BUG (P2) | Sidebar link is `/dashboard/public-website` but page lives at `/dashboard/website/*` → "Website Management" is NOT highlighted on any website page. |
| Loading | P2 | Full load shows skeleton "Loading your website…" 5–8 s on each direct URL open. |
| Overview | OK / BUG | "● Live", ESCAPE theme · Coral · Last published 8 Nov 2026, 11:01; cards Theme ESCAPE·Coral, Homepage 7 sections, Rooms 7 of 7, Offers None, Reviews 1, Booking Extras·Promo codes, Domain Free BinGi address, Online **Bookings paused**, "1 thing to finish: Write the headline in বাংলা", Inquiries none. Hero text "Barefoot days on Saint Martin's Island." on a Dhaka city hotel (demo copy live). |
| Theme & Style | OK / P1 | 8 included themes (NEST, COTTAGE, BUNK, CITY, VILLA, FLAT, ESCAPE live, GRAND) + "Theme Store (21)". Badges "Best on Starter / Business / Ultra" while this property's plan is "BinGi Growth" — plan names don't match. |
| Booking Engine | OK | How guests book / Guest payments (link to Settings), Extras ON, Promo code ON, Guest account Optional/Required, Confirmation message 61/240. **No website booking fee shown** anywhere on this page. |
| Google & Sharing (SEO) | OK / P2 | Page title with `{{page}}` token shown to user ("{{page}} becomes the page name") — template syntax exposed. Description 155/155, Google + Facebook previews OK. |
| Domain | OK | Free address Live `bingi.com.bd/hotel/pan-pacific-sonargaon-dhaka`, Copy/Open; own domain field + Save (not saved). |
| Online On/Off | OK / P1 | Website booking **Paused**, Marketplace Accepting, Online food ordering Accepting. "Applies at once". |
| Publish | OK / P2 | "Everything is live", history 7 versions; one entry shows raw key **"MODERN-RESORT theme"**; top entry title "Back to the default theme Live". "Start over / Back to default theme" (not clicked). |
| Homepage, Pages & Menu, Photos, Rooms, Services, Offers, Reviews, Contact, Inquiries, Languages | NOT TESTED in depth (time) | — |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Dashboard card vs Website status | Same status words | Dashboard "Website & booking: ✓ Published · Domain not connected"; Website Overview "● Live" + "Online: Bookings paused". Dashboard does not say bookings are paused. | BUG P1 |
| Website booking fee shown vs dashboard | Fee visible in Website › Booking Engine and equal to dashboard | Dashboard card: Marketplace 5% · Web booking 1% · Walk-in 0.01%. Website module shows no fee. Finance ledger snapshots show `commission_rate` 5 and 0.01. | PARTLY (fee only on dashboard) |
| "Walk-in 0.01%" | Walk-in = 0% (hotel's own sale) or explained | 0.01% commission on walk-ins (ledger `commission_rate:0.01`) | QUESTION P1 — confirm with founder |
| "Live" while "1 thing to finish" | Either block publish or call it optional | Live + unfinished Bangla headline | P2 |

### UI/UX vs approved design (prototype `src/components/hms/website/*`)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Sub-nav groups & labels | WM_PAGES 17 pages | same 17 | MATCH |
| Overview cards | status + checklist | same structure | MATCH |
| Theme & Style | themes + colour + heading font + logo | same | MATCH |
| Online On/Off | 3 toggles | same | MATCH |
| Module name | v7 "Website" | "Website Management" (sidebar + breadcrumb) | NO (GLB-P1-01) |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| E-WEB-P1-01 | Dashboard says Published, hides that website booking is paused | Dashboard card vs Website › Online | "Live · bookings paused" | Dashboard "Published", Website "Bookings paused" | Add online state to dashboard card |
| E-WEB-P1-02 | Theme plan badges use Starter/Business/Ultra, property on "BinGi Growth" | Website › Theme & Style | Same plan names everywhere | Mixed | One plan name source |
| E-WEB-P1-03 | Website booking fee not shown in Website module | Website › Booking Engine | Show "BinGi fee 1% per website booking" (matches dashboard) | Only dashboard shows 1% | Add fee row linking to Finance › Commissions |
| E-WEB-P1-04 | Walk-in 0.01% commission | Dashboard card / Finance ledger | 0% or documented | 0.01% | Confirm rule |
| E-WEB-P2-01 | Sidebar not highlighted on website pages | open any /dashboard/website/* | "Website" active | none active | Match on `/dashboard/website` prefix or fix link |
| E-WEB-P2-02 | Raw theme key "MODERN-RESORT theme" in Publish history | Website › Publish | Theme display name | raw key | map key→name |
| E-WEB-P2-03 | `{{page}}` token shown in SEO help | Google & Sharing | "Page name is added automatically" | `{{page}} becomes the page name` | plain text |
| E-WEB-P2-04 | Demo hero copy "Barefoot days on Saint Martin's Island" on Dhaka hotel | Overview preview | property's own text | demo text live | GLB-P2-06 cleanup |
| E-WEB-P2-05 | Slow first load 5–8 s | open /dashboard/website/booking | <2 s | skeleton 5–8 s | cache website draft |

---

## 3. Communication Center (`/dashboard/communication`)

### Screens & functions tested
| Screen / function | Result | Evidence |
|---|---|---|
| Tabs | OK / P2 | Overview · Automatic messages · Delivery · Credits · History (32 failed badge) · Delivery report. Tab text reads **"History , 32 failed"** (stray comma, page text). Same 6 tabs as prototype. |
| Overview | OK / BUG | Email credits 952 → 951 ("/1,000 from plan this month · 0 bought"), SMS 73 ("/100"), Sent today 39 (Email 19 · SMS 20), **Cost this month BDT 23.10** ("52 email · 27 SMS sent"), 44 automatic messages on, 32 failed in last 30 days. |
| Automatic messages | PARTLY | Very long list (~100 rows). Most rows say "Email and SMS turned off by BinGi for all hotels." Hotel sees Super-Admin/system rows: "KYC Approved · Sent when Super Admin approves hotel KYC", "Hotel Admin Credentials · Sent when Super Admin provisions…", "Hotel Registration". Footer "Message wording is set by BinGi" → no editable templates for hotel. |
| Credits | OK / P0 logic | "Plan gives 1,000 email and 100 SMS credits every month. Plan credits are used first… Each message costs BDT 0.20 (email) or BDT 0.50 (SMS)." "No SMS packs are offered right now." "No Email packs…" |
| History | OK / BUG | Rows like `880186773411 · Order Cancelled · To your team · Skipped · "SMS channel disabled or gateway not configured."` — phone shown with 12 digits (malformed / truncated BD number); developer reason text. |
| Delivery report | OK | Range Fri 30 Oct – Sat 28 Nov 2026: Messages 719 (Email 354 · SMS 365), Delivered 71% (80 sent), Failed 32, 607 skipped, **Cost BDT 23.30**, per-day table (e.g. Tue 24 Nov 336 msgs BDT 16.10). |
| API | OK | `communication-notifications 200`, `communication-notifications/reports 200` (totals email sent 52 / failed 32 / skipped 265; sms sent 27 / skipped 332; daily cost sum email 9.60 + sms 13.50 = 23.10 at first read). |
| Delivery tab, Buy credits, Resend failed | NOT TESTED (no packs offered; resend would send real SMS/email). |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Comm cost vs Finance "SMS & email cost" | Same number for same period | Comm Center BDT 23.10–23.30 (30-day range); Finance Overview **Tk. 37.80** (`finance/summary` `balance.communication_charges: 37.8`; brief said 37.10 earlier today → still growing). Difference ≈ Tk 14.50, no period label in Finance. One settlement meta shows `communication_charges 18.9`. | BUG P1 (unexplained gap) |
| Plan credits used first → no cost | While plan credits remain (951/1000 email, 73/100 SMS), cost = 0 | Cost charged BDT 23.10+ and deducted from hotel payable in Finance | BUG **P0** (money: hotel charged for credits the plan says are free) — or text is wrong; founder to confirm |
| Credits used vs sent | Email: 1000−951 = 49 used vs 52 sent; SMS: 100−73 = 27 used = 27 sent | Email off by 3 | P2 |
| Cost = sent × price | 52×0.20 + 27×0.50 = 23.90 | 23.10 (email 9.60 = 48 msgs) | P2 (minor mismatch) |
| "Cost this month" label | Calendar month | API range is last 30 days (30 Oct–28 Nov) | P2 |
| Delivered % | 80 / (80+32) = 71% | 71% | OK |

### UI/UX vs approved design (prototype `src/components/hms/communication/page.tsx`)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Tabs | overview/auto/policy(Delivery)/credits/history/report | same 6 | MATCH |
| Overview cards | Email credits, SMS credits, Sent today, Cost this month (link "BinGi balance" → Finance) | same 4 cards; no link to Finance | PARTLY |
| Credits packs | packs list with Buy | "No packs offered right now" | PARTLY (backend has no packs) |
| Name | v7 "Messaging" | "Communication Center" | NO (GLB-P1-01) |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| E-COM-P0-01 | Messages charged while free plan credits remain | Communication › Credits + Overview; Finance › Overview | Plan credits used first → BDT 0 until 1,000 email / 100 SMS used | Cost BDT 23.10+, Finance deducts Tk 37.80 from hotel payable | Charge only after plan credits are exhausted, or fix the text |
| E-COM-P1-01 | Comm cost ≠ Finance SMS & email cost | Compare Comm Overview vs Finance Overview | Same number, same period | 23.10/23.30 vs 37.80 | Show period in both; one source (ledger) |
| E-COM-P1-02 | Super Admin / system templates shown to hotel | Automatic messages | Only hotel-relevant messages; hide rows BinGi turned off | KYC Approved, Hotel Admin Credentials, "Super Admin" wording, ~60 "turned off by BinGi" rows | Filter list by audience + availability |
| E-COM-P1-03 | Malformed phone in History `880186773411` (12 digits) | History | +8801XXXXXXXXX (13 digits) | 12 digits → SMS can never deliver | Normalise phone on save |
| E-COM-P2-01 | "History , 32 failed" stray comma | tab bar text | "History 32" | comma | fix badge markup |
| E-COM-P2-02 | Dev reason text "SMS channel disabled or gateway not configured." | History | "SMS is off for this message" | dev text | GLB-P1-03 map |
| E-COM-P2-03 | "Cost this month" uses last-30-days | Overview | calendar month | 30 Oct–28 Nov | align |
| E-COM-P2-04 | Credits used (49) ≠ emails sent (52) | Overview | equal (or explain failed not charged) | off by 3 | — |

---

## 4. Settings (`/dashboard/settings/*`)

Live groups/pages (17): Overview · Property (Property profile, Branding, Language & region) · Stay & operations (Booking policies, Taxes & pricing, Housekeeping rules, Restaurant & inventory) · Online (How guests book) · Money (Guest payments, Invoices & documents) · Messages (Guest messages) · Access (Users & roles, Security, Properties) · System (Activity log, My preferences).
Brief items that do NOT exist as Settings pages on live: Outlets, Operations defaults (split into Housekeeping/Restaurant), Notifications, Message templates (moved to Communication Center, not editable), Appearance (inside My preferences), KYC (not in Settings), Channels/OTA & iCal, Plan & billing (prototype has `channels` and `billing`).

### Screens & functions tested
| Page | Result | Evidence |
|---|---|---|
| Overview | OK / P2 | "Pan Pacific Sonargaon Dhaka · Growth", Setup checklist **7 of 8** (missing "Who gets BinGi bills"), Recent changes. Activity lines use raw module names "· Hrm", "· Record", lowercase "recorded payment of 500.00 on expense", US date "Nov 28, 11:34 AM" (Activity log page uses "28 Nov 2026, 11:40"). |
| Property profile | OK / P2 | Loads in ~7 s ("Loading property profile…"). Type list shows **"Hotel" twice** (Hotel · Resort · … · Hostel · Hotel · 5-Star Resort …). Amenities library shows raw slug "Restaurant \| restaurant". Check-in/Check-out time + Currency here AND in Booking policies / Language & region → duplicates. |
| Branding | OK | Hotel logo, favicon, restaurant logo, dark/horizontal variants; link "Website colours and fonts: Website Management". |
| Language & region | OK / P2 | Loads **~10 s** (`GET hotels/me` slow). "Country and currency · Contact BinGi to change · Bangladesh · ৳ Taka (BDT)". Staff screens language: English / Bangla / **Hindi / Arabic** (no translations exist — not tested). Preview "19 Oct 2026 · 04:30 pm · BDT 5,750.00" while option reads "4:30 PM" (case/format mismatch). Same property language also in My preferences › "HMS display for everyone › Language" → duplicate. |
| Booking policies | OK | Check-in/out, early/late, cancellation (hours, fee type), no-show, tax on fees, policy text, links to How guests book, Children, Extra guest. |
| Taxes & pricing | OK / INFO | VAT and Service Charge rows show **0** (example: Room BDT 5,000.00 → Service 0 → VAT 0 → Guest pays BDT 5,000.00). Not changed (shared). Note "Restaurant and Other Services set their own" → 3 places for tax. |
| Housekeeping rules | OK | Rules + flow Check-out→Dirty→Cleaning→Inspected→Ready. "29 rooms set up" (Dashboard later also 29). |
| Restaurant & inventory | OK | Links into Meals/Inventory; Kitchen accepts automatically; receipt printer "Auto · USB · 80mm"; stock-out rule; low stock; allow negative stock. |
| How guests book | OK | Full payment / Advance / Booking request; applies to Direct website + Walk-in/manual; "If online payment is unavailable: Request booking". Duplicates Website › Booking Engine "How guests book" (that one links here — OK). |
| Guest payments | OK / P2 | Online: SSLCommerz / EPS run by BinGi; "No payout account yet · Add bank information"; At property: Cash → Cashbox, bKash, **bKash**, Nagad, Rocket, Bank transfer (bKash appears twice in page text — GLB-P1-04 likely still open; not clicked). |
| Invoices & documents | OK / P2 | Tabs Invoice / Stay agreement / Confirmation; A4 / Receipt printer, 58/80 mm, copies 1–5, "Open print dialog automatically" (GLB-P1-05 print dialog option). Loads slowly. |
| Guest messages | BUG P1 | "**30 of 39 messages are on**" — Communication Center Overview says "**44 automatic messages on**". |
| Users & roles | BUG P1 | 3 users: Md Yeapas (Owner), **Md Yeapas** again (Housekeeping, other email), **QA28 Staff One (Housekeeping · Active)** — created via Add staff with "Create a login account" UNCHECKED, still appears as an active HMS user with role dropdown + "Turn off". |
| Security | BUG P1 | Change password, Two-step sign-in **Off**, "Signed in now": **216 browser sessions** listed back to 13 Aug 2026, all one long list, none expired. |
| Properties | OK / P2 | "Pan Pacific Sonargaon Dhaka Main Branch · Default · MAIN · **Address not added**" (profile has an address) · "2 with access" (Users page lists 3) · Add branch / Add a property / Archive. |
| Activity log | BUG P1 | 55 entries, filters All/Hotel/Cashbox/Hrm/Subscription. My **Add staff (POST staff 201) is not logged**; no Booking/Meals/Website entries although other agents created bookings today. Raw labels "Hrm · Prepared", "Record · Updated". |
| My preferences | OK / P2 | Colour theme Light/Dark, date/time/number formats, opens-on page, pending widget, HMS display for everyone (text size, density, language EN/বাংলা, digits 123/১২৩, effects). Preview mixes "BDT 1,250.00" and "৳১২,৫০০". Sidebar Flat/Expandable not here (it is in sidebar footer); prototype has it in preferences ("Show all / Fold groups"). |
| Save test | NOT TESTED | All visible settings are property-wide and shared with other agents (VAT, policies, language); brief says don't change shared settings. No personal-only save was safely revertible within time. |

### Business logic checks
| Check | Expected | Actual | Result |
|---|---|---|---|
| Automatic messages count | Settings = Communication | 30 of 39 vs 44 on | BUG P1 |
| Staff without login → not an HMS user | Not listed in Users & roles | QA28 listed Active | BUG P1 (security) |
| Room count | One number | Housekeeping 29; Dashboard 28 → later 29 (room added by another agent) | OK |
| Users with access | Properties = Users | "2 with access" vs 3 users | P2 |
| Audit completeness | Every write logged | Staff create not logged | BUG P1 |

### UI/UX vs approved design (prototype `src/components/hms/settings/*`, IDS list)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Page list | overview, profile, branding, regional, policies, taxes, housekeeping, restaurant, **channels**, booking, payments, documents, **billing**, messages, users, security, properties, activity, preferences (19) | same minus channels & billing (17) | PARTLY |
| Users & roles | "Staff records stay in Staff", Users/Roles segmented | same text & segmented | MATCH |
| Invoices & documents | Invoice / Stay agreement / Printers + language EN/বাংলা/Mix | Invoice / Stay agreement / Confirmation; no document language option seen | PARTLY |
| Preferences | sidebar Show all / Fold groups + text size | text size here, sidebar toggle in sidebar footer | PARTLY |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| E-SET-P1-01 | Staff added without login becomes an active HMS user | Staff › Add staff (login unchecked) → Settings › Users & roles | Not a user | "QA28 Staff One · Housekeeping · Active" | Create staff record only; user only when box ticked |
| E-SET-P1-02 | Messages-on count differs | Settings › Guest messages vs Communication | same | 30/39 vs 44 | one counter API |
| E-SET-P1-03 | 216 never-expiring sessions | Settings › Security | Expire idle sessions (e.g. 30 days), paginate | 216 since 13 Aug | session TTL + cleanup |
| E-SET-P1-04 | Activity log misses writes | Add staff, then Activity log | "Staff added: QA28 Staff One" | not logged | log all module writes |
| (withdrawn) E-SET-05 | Room count 29 vs 28 | Settings › Housekeeping rules vs Dashboard | same | Housekeeping said 29 while Dashboard earlier said 28; later Dashboard showed "26 of 29 rooms" → another agent added a room during the test. NOT a bug. | — |
| E-SET-P2-01 | "Hotel" listed twice in property type | Property profile › Type | once | twice | dedupe |
| E-SET-P2-02 | Raw labels "Hrm", "Record", slug "restaurant" | Overview / Activity / Profile amenities | "Team & HR", "Expense", "Restaurant" | raw | label map |
| E-SET-P2-03 | Mixed date formats (Nov 28, 11:34 AM vs 28 Nov 2026, 11:40) | Settings Overview vs Activity | one format | two | shared formatter |
| E-SET-P2-04 | Language set in two places (Regional + My preferences "for everyone") | — | one place | two | keep in Regional |
| E-SET-P2-05 | Hindi / Arabic offered with no translation | Language & region | only EN/BN | 4 languages | hide until translated |
| E-SET-P2-06 | Slow pages 7–10 s (Profile, Regional, Documents) | open page | <2 s | skeleton 7–10 s | check `hotels/me` time |
| E-SET-P2-07 | Properties "Address not added" | Settings › Properties | address from profile | not added | link branch address |
| E-SET-P2-08 | Missing Channels (OTA/iCal) and Plan & billing pages vs prototype | — | per prototype | absent | follow plan |

---

## 5. Global UI

### Screens & functions tested
| Item | Result | Evidence |
|---|---|---|
| Sidebar groups (Flat) | PARTLY | Daily operations: Dashboard, Bookings, Room / Accommodation, Housekeeping, Guests, Chat, Meals · Property & team: Staff, Inventory, Other Services · Money & pricing: Discounts & Rates, Payments, Cashbox, Finance, Expenses, Billing & Subscription · Reports & online: Reports, Communication Center, Website Management, Settings. Only "Operations→Expenses" and "Discounts→Discounts & Rates" follow v7; Room / Accommodation, Meals, Staff, Other Services, Billing & Subscription, Communication Center, Website Management are still old names (GLB-P1-01). |
| Flat / Expandable | OK | Expandable folds groups with chevrons (Bookings, Meals expandable); stored in `localStorage['bingi-sidebar-nav-mode']`; switched back to flat. |
| Badges | OK | Housekeeping 1, Meals 4 at start; cleared later when counts dropped (no stale badge seen). |
| Sidebar active state | BUG P2 | Not highlighted on `/dashboard/website/*` (see E-WEB-P2-01). |
| Header search (button "Search modules… ⌘K") | PARTLY | Ctrl+K opens "Search navigation" drawer (OK). Searches only sidebar names: "team" → "No pages match this search." (page H1 is "Team & HR"); "staff" → "Staff". No settings/sub-page/record search. **Esc does not close** the drawer; previous query is kept on reopen. |
| Language "EN" in header | BUG P1 | "EN" is a link to Settings › My preferences, not a switch. Language options exist in 4 places (header EN, profile menu "Language English", My preferences "HMS display for everyone", Settings › Language & region "Staff screens in"). The only Bangla switch is **property-wide** ("Applies to all staff at this property"). Selecting বাংলা preview changed only the sample line ("রুম ২০৪ · ৳১২,৫০০ · অতিথি দুপুর ২টায় আসবেন"), sidebar/page stayed English. Setting `localStorage bingi-lang=bn` + reload: UI still English (server setting wins). Restored `bingi-lang=en`. |
| Bangla text on 5 screens | NOT TESTED | Requires saving the property-wide language = all other agents' screens turn Bangla. Not done (rules: no shared setting changes). |
| Notifications | OK | Panel "Notifications 59 new · Mark all read", tabs All/Unread/Booking/Payment/System, items "Booking status updated · WBK-2026-000106 is now checked out", "View All Notifications". Bell badge "9+". |
| Profile menu | OK / P2 | Name + email, Current property "Pan Pacific Sonarga… Active", My Profile, Preferences, Security, Color theme toggle, Language English, Sign Out. Property name truncated. |
| "New property" header button | P2 | Red primary pill on every page → `/onboarding`; competes with each page's own red primary (e.g. "+ New Booking" right below). Should be in property switcher, not a global primary CTA. Not clicked through (onboarding out of scope). |
| "Plan not selected" footer flicker | BUG P2 (still open) | Polling the sidebar footer during reload: first "**Plan not selected · Checking plan...**", then "BinGi Growth · active". |
| Breadcrumbs | PARTLY | "Staff › People", "Staff › Attendance", "Staff › Details" (payroll run — generic), "Website Management › Booking Engine", "Settings › My preferences". Breadcrumb uses old names. |
| PWA install | OK (visible) | "Install BinGi HMS" button (download icon) in mobile header; hidden on desktop. Not installed. |
| Currency formats | BUG P2 (GLB-P2-01 still open) | Dashboard "BDT 16 / BDT 161,766 / BDT 26,600"; Finance "Tk. 697,551.56"; Payroll "1,35,000" (lakh, no symbol) + "Gross 135000"; Communication "BDT 23.10"; Preferences preview "BDT 1,250.00" and "৳১২,৫০০"; Regional "৳ Taka (BDT)". Western vs lakh grouping mixed. |
| Date formats | P2 | "Saturday, Nov 28, 2026" (Dashboard), "Nov 28, 11:34 AM" (Settings overview), "28 Nov 2026, 11:40" (Activity), "28 Nov, 10:40 am" (HR activity). |
| Empty / loading states | OK / P2 | Good empty states (Schedule, Leave, Payroll, Departments). Skeleton loads 5–10 s on Website, Settings Profile/Regional/Documents, Communication (mobile). |
| Drawers | P2 | Add staff / Mark attendance / Prepare payroll: right drawer with dark page dim (design rule: no dark overlays). Mark attendance drawer inputs touch right edge. |
| Mobile (window min 500×701 — Chrome would not go to 390) | OK / P2 | Dashboard: cards stack, bottom tab bar Dashboard/Bookings/Room / Accommodation/Guests/More. Team & HR: header buttons wrap, tabs scroll (Overview…Leave…). Communication: tabs scroll, cards 2-col. Settings: section pills scroll. Website: sub-nav becomes pills; overview loads ~10 s. Tab label "Room / Accommodation" wraps on 2 lines in bottom bar. Window restored to 1568×741. |
| Favicon | P2 | One page load requested the favicon PNG 10× with `?v=<timestamp>` (cache-busting each render). |
| Dashboard numbers moving | INFO | "Room revenue today" BDT 16 → BDT 161,766 → BDT 6,016 within ~10 min (other agents creating/cancelling bookings). Not my scope; flag for group B/D. |

### UI/UX vs approved design (prototype `src/app/hms/layout.tsx`, design-system, old 10_Global_UI_UX.txt)
| Screen | Prototype | Live | Match |
|---|---|---|---|
| Sidebar names | v7 names (Rooms, Restaurant & Bar, Team, Services, Rates & Discounts, Expenses, Plan & Billing, Messaging, Website) | 2 of 9 renamed | PARTLY |
| Sidebar style toggle | in My preferences (Show all / Fold groups) | in sidebar footer (Flat / Expandable) | PARTLY |
| Search | Cmd-K over modules | Ctrl+K drawer, top-level only | PARTLY |
| Drawers | one light drawer, no dark overlay | dark dim | NO |
| Money format | ৳ + lakh grouping | BDT / Tk. / ৳ mixed | NO |

### Old issues status (10_Global_UI_UX.txt)
| ID | 24/25 Nov | 28 Nov |
|---|---|---|
| GLB-P1-01 old names | open | PARTLY fixed (Expenses, Discounts & Rates); rest open |
| GLB-P1-03 dev/API text | open | STILL OPEN ("SMS channel disabled or gateway not configured.", "Super Admin", "{{page}}", "MODERN-RESORT", "Hrm", "usr_179") |
| GLB-P1-04 bKash twice | open | LIKELY STILL OPEN (Settings › Guest payments page text lists "bKash · bKash") — not clicked |
| GLB-P1-05 print dialog | open | Option "Open print dialog automatically" exists in Invoices settings — not tested |
| GLB-P2-01 money format | open | STILL OPEN |
| GLB-P2-02 slow | open | STILL OPEN (5–10 s pages) |
| GLB-P2-03 drawers | open | STILL OPEN (dark dim) |
| GLB-P2-04 Esc | open | Esc now does NOT close search drawer (opposite problem) |
| GLB-P2-06 demo data | open | STILL OPEN (website hero "Saint Martin's Island") |
| GLB-P2-08 dates | open | STILL OPEN (4 date styles) |
| GLB-P2-10 validation | open | STILL OPEN (staff phone "123") |
| "Plan not selected" flicker | open | STILL OPEN |

### Bugs
| ID | What | Steps | Expected | Actual | Fix idea |
|---|---|---|---|---|---|
| E-GLB-P1-01 | No per-user Bangla switch; header "EN" is only a link | Click EN | Toggle EN/BN for me | Opens My preferences; BN only property-wide | Per-user language (stored on user) + header toggle |
| E-GLB-P1-02 | Language in 4 places | header, profile menu, My preferences, Language & region | one place | four | keep Language & region (property) + one user toggle |
| E-GLB-P1-03 | Old module names (7 of 9) | sidebar | v7 names | old | GLB-P1-01 |
| E-GLB-P2-01 | "Plan not selected · Checking plan..." flicker | reload any page | skeleton until plan known | wrong text ~0.5 s | render placeholder |
| E-GLB-P2-02 | Search finds only top-level sidebar names; "team" → nothing | Ctrl+K "team" | Team & HR, People, Payroll… | "No pages match" | index sub-pages + synonyms (v7 names) |
| E-GLB-P2-03 | Esc doesn't close search drawer, old query kept | Ctrl+K, Esc | closes, clears | stays | handle Esc |
| E-GLB-P2-04 | Currency format mixed | many | ৳ + lakh | BDT / Tk. / ৳ | one formatter |
| E-GLB-P2-05 | Global red "New property" CTA on every page | header | in property menu | primary pill | demote |
| E-GLB-P2-06 | Favicon refetched 10× with timestamp | any page load | cached once | 10 requests | stable URL |
| E-GLB-P2-07 | Dark overlay drawers | Add staff etc. | light drawer | dimmed page | shared Drawer |
| E-GLB-P2-08 | 4 date styles | Dashboard/Settings/Activity/HR | one | four | shared date formatter |

---

## Test data created
| Record | Where | ID / evidence | Note |
|---|---|---|---|
| Staff "QA28 Staff One" | Staff › People (`POST staff 201`) | user/staff `usr_179`, phone "123", email qa28.staff1@example.com, role Housekeeping, basic salary 15,000 | Also appears as HMS user in Settings › Users & roles (Active). Lead: turn off / remove. |
| Attendance QA28 Staff One, 28 Nov 2026, Present 08:00 | Staff › Attendance (`PUT hrm/attendance 200` ×2) | — | — |
| Payroll run November 2026 (draft) | Staff › Payroll (`POST hrm/payroll/runs 201`) | run id **1**, status draft, unpaid, 2 staff, net 1,35,000 | NOT reviewed/approved/paid. Includes Md Yeapas 1,20,000. Lead: delete/cancel draft if possible. |

Shared state touched and restored: `localStorage bingi.staff.mode` easy → full; `bingi-sidebar-nav-mode` expandable → flat; `bingi-lang` bn → en; My preferences Bangla preview → Discard (never saved); window 500×701 → 1568×741.

## Not tested (why)
- Bangla text on 5 main screens — only a property-wide language save exists; saving would switch every parallel agent's UI.
- Payroll → Expense posting — needs paying payroll (forbidden).
- Settings saves — all pages are property-wide shared settings (VAT, policies, language, payments); not changed by rule.
- Website: Homepage/Pages/Photos/Rooms/Services/Offers/Reviews/Contact/Inquiries/Languages editors, Publish, Domain save — view only by brief / time.
- Communication: Delivery tab, Resend failed, Buy credits (no packs offered; resend sends real messages).
- HR: Hiring, Team Operations, Leave add/approve, Shift create/publish, Corrections, HR reports, role permission edit.
- KYC, Outlets, Notifications settings — no such Settings pages on live.
- True 390 px width — Chrome window minimum was 500 px.
- Project doc "HR_By_Plan_Team_vs_FullHR_2026-11-23.md" — not readable here; used brief + prototype `staff/plan.tsx` comment ("HR by plan (23 Nov 2026): Business gets Team; Ultra gets the full HR").
