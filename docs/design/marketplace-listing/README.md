# Marketplace listing onboarding — v1 (prototype)

Date: 25 Nov 2026 · Branch `feat/marketplace-listing-onboarding` · Truth label: **prototype only** (browser data, nothing sent to BinGi, no real payout, no real review).

## Goal
A property owner who only wants to sell rooms on the BinGi Marketplace can list in about 10 minutes, without the full HMS onboarding (plan, room numbers, floors, team, modules).

Same account, same property data, same booking/payment backend as the HMS. Only the entry and the onboarding are separate. Upgrading to HMS later must not ask for anything again.

## Decisions taken for this build (founder was away — confirm)
| Topic | Used in v1 | Why / open |
|---|---|---|
| Commission, listing only | **9%** (one constant `LISTING_PCT`) | Founder said 9%, later mentioned 11%. Change one number. |
| Commission, HMS plans | **7%** flat (`HMS_PCT`) | Decided 25 Nov. |
| Gateway fee | **2.5%** only on money paid online, shown separately (`GATEWAY_PCT`) | Founder 25 Nov. Who pays (hotel vs guest) still open; v1 shows it deducted from the hotel's payout. |
| Availability | **Instant booking** + host calendar (close dates / rooms left per day) | Same as today's marketplace (Pay full / Pay 30%). Request-to-book can be a later setting. |
| Approval | Auto checks (cover photo, a photo for every room type, price at least ৳500, phone) **then BinGi review** before live | Matches the 1 Nov audit ticket 31 (listing quality gate). Min price constant `MIN_PRICE` is a placeholder. |
| KYC (NID) | Not needed to submit; **needed before the first payout** | Audit recommendation: KYC gates money, not setup. |
| Payout | bKash / Nagad / bank account of the owner | Weekly payout is shown as "planned", not promised. |

## Flow
```
bingi.app  ──►  /list  (landing: hook, what it costs, earnings example, Start)
                  │ phone + OTP (demo code 123456)
                  ▼
           /list/setup  — 3 parts, 9 screens, one question per screen, autosave
             A. Your place      1 Type · 2 Name · 3 Location · 4 Amenities
             B. Rooms & photos  5 Room types (name, guests, bed, how many, price) · 6 Photos
             C. Get paid        7 House rules & cancellation · 8 Payout & fees · 9 Review & submit
                  │ Submit
                  ▼
           /list/host  — listing mode (no HMS sidebar)
             Status: In review → Live (prototype: "Simulate approval")
             Tabs: Today · Bookings · Calendar · Payouts · Listing
             Upgrade card: "Run your whole property with BinGi HMS — 7% instead of 9%"
```

## Screens (exact count)
- Landing `/list`: 1 (with sign-in panel)
- Setup: 9 steps + 1 "Submitted" screen = 10
- Host: 5 tabs (Today, Bookings, Calendar, Payouts, Listing)
- Total: **16**

## What must not change
- HMS onboarding (`/onboarding`) and HMS screens are untouched.
- Booking status, payment status and listing status stay separate.
- No real numbers are invented: the host dashboard shows empty states until a (demo) booking exists; demo bookings are labelled.

## Production handoff (short)
- Frontend: routes above; reuse onboarding shell components.
- Backend: `property.mode = "listing" | "hms"`; listing uses the same property, accommodation category and booking tables. Upgrade = set mode to `hms` + choose plan. Commission rule reads mode. Review queue in Super Admin (existing Marketplace approval). Payout account + KYC before first payout.
