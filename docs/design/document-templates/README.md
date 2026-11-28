# Document templates v2 (prototype, 24 Nov 2026)

Settings › Invoices & documents › **Design** (one look for every A4 document):
- **6 templates:** Folio (big-hotel guest folio), Classic (centred, fine lines), Modern (colour band with logo),
  Elegant (serif, centred - resorts/boutique), Compact (tight rows, one page), Minimal (amount due large on top).
- **Colour:** 8 presets or any colour (colour picker).
- **Language:** English · বাংলা (Bangla labels, digits, dates, amount in words) · Mix (English + small Bangla).
- **Text size:** Small / Normal / Large. **Logo size:** S / M / L. Logo from Branding; no logo → initials badge.
- Live preview of a real booking before saving.

Engine: `src/lib/bookings/doc-kit.ts`. Invoice: `docs.ts › invoiceHtml`. Next on the same kit: confirmation,
stay agreement, registration card, money/refund receipt, guest register, Form-C.

Status: prototype only. Demo property "Azure Bay Grand Resort" and its logo are fictional.
