# GRAND — Ultra plan master theme · Plan v1.1 (9 Nov 2026)

Reference: "BinGi Resort" 9 screens (Home, Rooms, Dining, Experiences, Offers, Explore, My Trip, Booking & Billing, Checkout).
Keep the look; fix the logic below. Build with Claude Code (Next.js). Mobile + tablet must be *super* responsive.

## Decisions (answered 9 Nov)
| # | Decision | Answer |
|---|---|---|
| D1 | Repo | `nazmulhasanovx/BINGI-WEB-theme-`, one branch per theme → this is `theme/grand` |
| D2 | Custom hex beyond 10 presets | Proposal: yes on Ultra, with contrast guard — **pending** |
| D3 | Stack | Next.js (SSR for SEO) — confirm current live hotel-site stack with dev |
| D4 | Dining | Meal & Restaurant management exists in HMS (live). Table reservation / in-stay order endpoints: dev to confirm exact API |
| D5 | Guest account | = BinGi Marketplace guest account |
| D6 | Demo data | Azure Bay Grand Resort (fictional, Inani, BDT) |

## Keep from reference
Top info bar · white header + My Trip · photo hero + floating search · horizontal cards · chip filters · Explore = one page with tabs · My Trip timeline · sticky summary.

## Logic fixes
1. Home icon row duplicates the nav → removed; Dining/Experiences teasers instead.
2. Same big hero on every page → full hero only on Home; inner pages get a short hero with their own photo.
3. Newsletter on every page → removed (no backend); footer only once backend exists.
4. Generic trust strip → real facts: review score, check-in/out time, cancellation, pay at hotel.
5. Search + user + My Trip in header → one "My Trip" account button; no search on a single-hotel site.
6. Wishlist hearts → removed (marketplace feature).
7. Room detail page missing → added.
8. Price without dates → "from ৳X"; with dates → real availability + total.
9. Mixed Book Now / View Details → card opens detail; one CTA "Select".
10. Heavy filter sidebar → chips; sidebar only when 12+ categories.
11. Cart icons on dishes → menu is for viewing; "Add to stay" only when the guest has a booking.
12. Cart could hold dining without a room → cart is always anchored to a stay.
13. 4-step stepper but guest+payment on one screen → single-page checkout with 3 sections.
14. VISA/PayPal/Apple Pay, USD → only hotel-enabled methods (pay at property, bKash/Nagad manual, 30% advance; card only when gateway approved), BDT, VAT/SC per country pack.
15. Footer links to pages that don't exist → only real pages.
16. Ratings → real reviews only; hidden under 5 reviews.
17. Packages (spa + dinner bundles) → Packages backend not live; show Discounts now, Packages behind a flag.
18. Confirmation page missing → added.

## Routes (17)
Public: Home · Rooms · Room detail · Dining · Experiences · Offers · Explore (About · Facilities · Gallery · Location · Contact) · Events enquiry
Booking: Stay cart · Checkout · Confirmation
Guest: Sign in (phone OTP, Marketplace account) · My Trip (Overview · Bookings · Orders · Invoices · Profile) · Booking detail / cancel
System: Policies · 404 · Site paused

## Build phases (each: build → test → fix → show)
| Phase | Scope | Status |
|---|---|---|
| B0 | Next.js, theme engine, 10 colour themes, contrast guard, demo data, Theme Lab | Done (this branch) |
| B1 | Shell (top bar, header, mobile menu, footer, sticky Book bar) + Home | Done (this branch) |
| B2 | Rooms + Room detail + availability search sheet | Next |
| B3 | Stay cart + Checkout + Confirmation | |
| B4 | Dining + Experiences + Offers | |
| B5 | Explore + Events + Policies + 404 / paused | |
| B6 | Sign in + My Trip | |
| B7 | বাংলা/English, a11y, Lighthouse, device QA, dev handoff | |
