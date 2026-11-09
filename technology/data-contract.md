# Data contract (all themes)

The site renders one `Hotel` object (see `src/lib/types.ts`). Today it comes from demo data (`src/data/azure-bay.ts`); later from the BinGi HMS public API. Only `src/lib/data.ts` changes when the API is connected.

| Data | HMS source | API status |
|---|---|---|
| Hotel profile, address, check-in/out, contact | Settings → Property | dev to confirm endpoint |
| Branding: logo, colour theme, heading font | Settings → Branding / Website → Theme & Appearance | colour-theme field **new** |
| Room categories, photos, beds, size, amenities, base price | Rooms | existing (approved rooms only) |
| Availability + rate for dates | Rates & Inventory / Booking engine | existing (verify) |
| Extras (pickup, breakfast, spa, decoration…) | Other Services | verify |
| Restaurants, menu, hours | Meals (Restaurant & Bar) | live module — endpoint to confirm |
| Table reservation / in-stay order | Meals | dev to confirm |
| Discounts / offers | Discounts & Rates → Discounts | existing |
| Packages | Packages | **planned** (not live) |
| Reviews (score, count, snippets) | Guests → Reviews | existing |
| Policies (cancellation, child, pets) | Settings → Booking Policies | existing |
| Guest payment methods | Settings → Guest Payments | existing |
| Create booking → reservation | Reservations | existing (source = Website) |
| Guest sign-in (phone OTP) | Marketplace guest account | existing on bingi.app |
| My Trip: bookings, orders, invoices | Reservations, Meals, Finance | verify |

Hotel resolved by slug `bingi.app/hotel/<slug>` or custom domain (Business+).
