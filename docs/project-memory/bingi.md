# BinGi: core project memory

## Identity and status
- Context moved from ChatGPT to Claude in Oct 2026. The newest explicit decision overrides older ones.
- BinGi is the brand. The main product is BinGi Hotel Management Technology (BinGi HMS).
- The parent company is NEONECY; the founder is Nazmul Hasan.
- Origin is Bangladesh. The first market is Cox's Bazar, then international (Bangladesh, China, Europe and USA as campaign positioning, not subsidiaries).
- Concept: a connected hospitality operating system, not just a PMS. "The hotel team runs the hotel; BinGi runs the hotel's technology."
- Target customers run from guest houses to mega resorts and multi-property groups. The scalability goal is ~10–10,000 rooms; this is a goal, not a benchmark.
- The ecosystem has ~52 module categories across 8 areas: Web HMS, Mobile HMS, Booking/Marketplace, Guest App, Website Builder & Themes, Direct Booking Engine, Reservations, OTA/Channel Mgmt, Restaurant/POS/KDS/QR, Housekeeping, HRM, Finance & Revenue, BinGi Payments (planned), Communication, CRM, Reports, Digital Presence, Integrations Hub, BinGi AI (Coming Soon), Super Admin & Subscriptions, Multi-Property, Onboarding/Training/Support.
- App Store status is uncertain: iOS "BinGi - Hotel Booking" 2.1.0 and "BinGi HMS" 1.3.0 had review issues in Sep–Oct 2026.

## Core decisions
- One connected ecosystem shares one booking ID: discovery (website/marketplace/OTA/walk-in) → reservation → room assignment → communication → check-in → in-stay services → folio/payment → checkout → settlement/reporting → guest history.
- Keep the existing backend and business logic. Redesign UI, navigation and workflows only. Never present design-only screens as a working backend.
- Modules used daily stay directly in the sidebar. Only less-frequent items are grouped.
- Booking status, payment status, room readiness and maintenance status are separate dimensions.
- **Booking Calendar:**
  - 3 modes (Room, Rates & Inventory, Revenue), Easy vs Advanced.
  - Drag/resize, conflict protection, maintenance blocks, unassigned, group, waitlist.
  - Must stay dense but clear for 100+ room properties.
- **Rates & Inventory:** base/selling rate, BAR, min stay, CTA/CTD, Stop Sell, bulk edit.
- **Operations:** front desk today, arrivals/departures/in-house, room status, housekeeping, maintenance, requests. Checkout auto-creates a housekeeping task.
- **Staff:** two levels, Basic Staff Management vs Full HRM, gated by subscription.
- **Live in production (27 Oct 2026):** HRM, Meal Management (Restaurant & Bar), Inventory and Accounts.
- **OTA targets:** Booking.com, Agoda, Airbnb, Expedia/Hotels.com, Trip.com; later Traveloka and MakeMyTrip. Never claim a live integration without verification.
- **Access** respects role, property membership, allowed operation and subscription.
- **Live use:** hms.bingi.app is the staging server. The system is already used by many, so must-fix bugs come before redesign.
- **HRM vision:**
  - Staff get their own BinGi account and a job marketplace.
  - Certificates are issued by the hotel. Payroll is paid manually via Accounts.
  - Staff exit needs a 30-day notice period.
- **Restaurant/Inventory:** outlets are Linked or Independent per outlet.
- **Connectivity module:** channels, payment gateways, BinGi API, BinGi AI (cloud + local, Beta), devices — active, inactive and available states.
- **Plan limits:** staff app access, outlets, rooms. Every plan has a minimum. The owner upgrades in one click and it activates right away.
- **OPERA-gap modules approved (2 Nov 2026):**
  - Modules: Night Audit, Packages, Company profiles + City Ledger, Share/Split bill, Rooming list.
  - Ultra only: Events & Banquet, Upsell.
- **Onboarding:** country and location first. One setup should finish ~80% of the owner's work. A simple support option, and a dashboard tutorial.
- **UI:** skeleton loading must be used. Integrations show connected/disconnected/error/pending.
- **Free trial** gives only the chosen plan's features. The Marketplace lives at bingi.app.
- **Product cadence:** monthly updates, a big update every 6 months ("BinGi 27").
- **URLs:** technology.bingi.com.bd is the public site; superadmin.bingi.app is the testing Super Admin.
- **Super Admin** approves rooms before they appear on the Marketplace.
- **HMS direction:** each plan gets exactly what it needs. The simple view is the default (most customers are small hotels).

## System master (2 Nov 2026)
- **Platforms:** Web HMS, Mobile HMS (role-wise tabs), Staff app (BinGi ID, free), Guest app + Marketplace (bingi.app), hotel website themes, Super Admin, public site + pricing.
- **Plans:**
  - Starter: Simple mode.
  - Business: full, no restaurant (but see 11 Nov below).
  - Ultra: + Restaurant & Bar + Events.
  - Enterprise: + Portfolio.
  - Meters: room, outlet, SMS.
- **Core engines:** entitlement (plan × add-on × class × role × flag), country pack, 4 separate statuses, outlet/store/cost center, event bus + audit log, Super Admin as the pricing source.
- **Data flow on one booking ID:** Marketplace/Website/OTA/Walk-in → Reservation → Room assign → Check-in → Services → Folio/Payment → Check-out → Housekeeping auto → Night Audit → Accounts → Reports → Guest history.
- **Support:** onboarding WhatsApp/call back; in-app "? Help" (articles, 1-min Bangla videos, chat, What's new); a "Getting started" card. No forced tours, no floating bubble.
- **Deferred from OPERA:** Loyalty, travel-agent commission, e-sign reg card, wake-up call. Backend build order: Night Audit → Packages → City Ledger → Events.
- **Not live yet:** OTA, BinGi Payments, BinGi AI, API, Events, Night Audit, Packages, City Ledger.
- **UI/UX requirements:** some user customisation; responsive on all desktops and tablets; iOS-style organised UI; proper contrast; Bangla + English; adjustable text size.

## Sidebar v6 (8 Nov 2026)
- **Daily operations:** Dashboard, Bookings, Rooms, Housekeeping, Guests, Chat, Meals.
- **Property & team:** Staff, Inventory, Other Services.
- **Money & pricing:** Discounts & Rates, Payments, Cashbox, Finance (Overview · Expenses & Accounts = old Operations · Billing & Subscription).
- **Reports & online:** Reports, Communication Center, Website Management.
- **Settings** sits at the bottom.

## Subscription and pricing
- **Plans:** Starter, Business, Ultra, Enterprise (custom).
- **11 Nov 2026 pricing** (per room per month; replaces ৳30/৳50/৳116):
  - Starter ৳25 / Business ৳70 / Ultra ৳116.
  - 6-month / 12-month rates: Starter ৳23/৳19, Business ৳63/৳53, Ultra ৳105/৳87.
  - These are already after a 60% launch discount.
  - Starter stays ৳25 at all times.
  - No VAT is charged yet.
  - The launch offer runs 3 months; hotels that join during it keep the launch price.
- **Activation:** Business ৳14,500 (currently ৳4,999); Ultra regular ৳29,500 (currently ৳8,999).
- **11 Nov 2026 plan rule:** Restaurant is also in Business but limited; Ultra gets it in full. Theme Store themes are ৳50/month each (currently free).
- **Historical prices:** several old versions exist. Never reuse them without confirmation.
- **Trial:** the newer ad CTA says a 7-day free trial.
- **Hotel OTP/SMS/email** go through the hotel's own connected provider. If the hotel doesn't connect one, OTP isn't sent.

## Public website
- It is small: technology.bingi.com.bd, built in React (repo BINGI-PUBLIC-PLATFROM), site language English.
- It has a light theme, SaaS motion, Studio Display and iPhone frames, and GIF slots.
- Added pages (10 Nov 2026): Themes, Solutions, Blog/Guides, Customer stories, Changelog, Marketplace & partners, Careers.
- Public BinGi documentation for all modules, written so any LLM can answer from it (10 Nov 2026).

## Hotel website themes
- There are 3 master themes, one per plan (Starter / Business / Ultra). Ultra is built from his "BinGi Resort" reference, with 10 colour themes.
- All theme code lives in the repo BINGI-WEB-theme-, one repo for all property categories.
- The website guest account is the Marketplace guest account.
- ~70% of guests use phones, so the site must feel like an app.
- **Website Management** is one master module inside the theme repo (HMS 1:1). It must be clean, low-text and Apple/Telegram-feel.
- **Luxury themes:** v1 was rejected. v2 = flagship ISLE (real WebGL 3D), each theme with its own fonts.

## Demo data: Azure Bay Grand Resort (fictional)
- Inani, Cox's Bazar. 5-star, BDT, Asia/Dhaka. 24 rooms; check-in 2 PM, check-out 12 PM.
- **Rooms:**

| Rooms | Type | Price |
|---|---|---|
| 101–108 | Deluxe Garden View | ৳12,000 |
| 201–206 | Premier Ocean View | ৳16,000 |
| 301–304 | Executive Ocean Suite | ৳25,000 |
| 305–308 | Family Resort Suite | ৳32,000 |
| V01–V02 | Private Pool Villa | ৳55,000 |

- **Services:** pickup ৳3,500, extra bed ৳2,500, breakfast ৳1,200 / ৳600, spa ৳4,500, …
- **Restaurant:** "Ocean Table".

## Open items
- **To verify:** pricing per plan, trial, App Store, OTA, payments, backend for redesigned screens, AI, restaurant/KDS/QR live status.
- **The 1 Nov 2026 audit** (146 points) is in `bingi-audit-2026-11-01.md`.
- **Agreed phases:**
  1. P0 dev fixes
  2. Decisions
  3. Foundation + shell
  4. Go-live path
  5. Full HMS + Super Admin module by module
  6. Staff app, mobile, "BinGi 27"
- **Room add flow** (live HMS, floor → tap room numbers from a master list) is liked. Room number, block and building are never custom; presets only.
- **The Rooms module** is named "Room / Accommodation" (11 Nov 2026).
- **Updated UI designs** are kept in "/Users/neonecy/Desktop/BINGI UPDATED UI SCREEN".
