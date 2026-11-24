# Document templates v1 (prototype, 24 Nov 2026)

Settings › Invoices & documents › **Design**:
- Template: **Classic** (logo centred, formal), **Modern** (logo left, thin colour bar), **Compact** (most on one page).
- Colour: 6 presets (BinGi red, ink, green, blue, brown, purple) or the hotel's own colour.
- Logo size S / M / L. Logo from Settings › Branding; no logo → initials badge in the chosen colour.
- Language: English, or English + বাংলা sub-labels.
- Live preview of a real booking invoice, updates before saving.

One design is used by every A4 document in `src/lib/bookings/docs.ts`: invoice, booking confirmation,
money/refund receipt, registration card, guest register, Form-C. Fonts: IBM Plex Sans + Noto Sans Bengali.

Settings key: `docs.design = { template, accent, logoSize, lang }` (old saved settings get the default `compact`).

Status: **prototype only** (not in live HMS). Demo logo `azure-logo.svg` is an original drawing for the
fictional demo property "Azure Bay Grand Resort".
