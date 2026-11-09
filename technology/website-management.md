# HMS · Website Management (in this repo)

Open `/hms/website/overview`. The HMS shell (sidebar + header) matches the live HMS, so other modules can be designed here too (`/hms/<module>` placeholders exist).

## 6 pages
Overview · Design (theme, colour, font) · Homepage (sections, menu) · Content (rooms, services, offers, reviews & gallery, photos) · Settings (booking, contact, Google & sharing, domain, language, online on/off) · Publish (preview, publish, history).

## Add a new theme — no admin work
1. Build `src/themes/<name>/Home.tsx`; wrap each homepage block in `DraftSections` with an `id`.
2. Put editable words in `DraftText` (`k="hero.title"`).
3. Add one entry in `src/themes/manifest.ts` (sections + fields + plan + property types).
4. Register it in `src/themes/registry.ts`.
Website Management reads the manifest and shows the theme, its sections, fields and plan lock automatically.

## Draft → publish
`src/lib/site.ts` keeps `draft`, `published`, `versions` per property. The site shows `published`; the admin preview (`?preview=draft`) shows the draft live as you type.
Prototype: stored in the browser (localStorage). Production: HMS backend (`site_draft`, `site_published`, `site_versions`).

## Applies on the site now
Theme, colour, font, section order/visibility, headline/intro/section titles (EN + বাংলা), menu items, room/offer/review/service visibility.
Saved but not yet read by themes (needs HMS API): booking engine, contact info, SEO, gallery order, domain, online on/off, footer.
