# GRAND — colours, type, responsive rules

## Colour engine
Hotel picks 1 of 10 colour themes. Neutrals are shared; only the brand family changes.

| Token | Use | How it is made |
|---|---|---|
| `--brand` | icon tiles, accents, active nav underline, large fills | the theme colour as chosen |
| `--action` | button fill, links, prices in colour | brand darkened until white text ≥ 4.5:1 (WCAG AA) |
| `--action-hover` / `--action-pressed` | states | action −8% / −16% lightness |
| `--on-action` | text on buttons | white (guaranteed by the rule above) |
| `--brand-soft` / `--brand-soft-2` | tinted chips, icon tile bg, selected rows | brand mixed 7% / 13% into white |
| `--ink` `--muted` `--canvas` `--surface` `--line` | text and surfaces | fixed for every theme |

| # | Theme | Brand |
|---|---|---|
| 1 | Coral (default) | #F0503F |
| 2 | Ocean | #1E6FD9 |
| 3 | Lagoon | #0F9488 |
| 4 | Forest | #2F7D4E |
| 5 | Terracotta | #C2603A |
| 6 | Sand Gold | #B88A2E |
| 7 | Royal Navy | #1F3A6B |
| 8 | Plum | #7A3E8C |
| 9 | Rose | #D94B7B |
| 10 | Graphite | #2E3338 |

Theme Lab (`/theme-lab`) shows every theme with its computed tokens and contrast ratios.

**Theme switcher bar** (dark strip at the very top of every hotel page, for designers/developers): 10 colour swatches, Sans/Serif heading toggle, link to Theme Lab. The choice is kept in the browser while you navigate; `?theme=ocean` also works.
Not shown to real guests: set `NEXT_PUBLIC_THEME_SWITCHER=off` in production — the hotel's theme then comes from HMS (Website Management → Theme & Appearance).

## Type
Heading: Plus Jakarta Sans (option: Fraunces serif) · Body: Plus Jakarta Sans · Bangla: Hind Siliguri.
Scale (desktop → phone): H1 56→34 · H2 32→24 · H3 20→18 · body 16→15 · small 14→13.

## Responsive
Breakpoints: 360 · 390 · 834 · 1024 · 1280 · 1440 (max content 1240).
- ≥1024: top info bar, full nav, floating search bar on the hero.
- 834 (tablet): no top bar, nav in menu sheet, search bar stays inline (2 rows), cards 2-up.
- ≤600 (phone): search becomes one pill → bottom sheet; cards 1-up horizontal scroll where useful; sticky bottom bar "from ৳X · Book"; tap targets ≥ 44px; hero text 34px.
- Respect `prefers-reduced-motion`; safe-area insets on iPhone.
