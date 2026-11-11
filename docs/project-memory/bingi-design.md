# BinGi design memory

## Brand and UI style
- **Palette:**
  - Deep Red #B11C29 for actions, used sparingly.
  - Warm White canvas, white cards, soft greys, Pale Rose for selection, Charcoal headings.
  - (9 Nov 2026) The logo coral #FD413F is chosen as the brand fill colour.
  - Buttons and red text use #C8232E. Hover #B11C29, pressed #8F1520.
- **Feel:** premium, calm, modern international SaaS. An iOS-inspired desktop app with Telegram-smooth motion and skeleton loading.
- **Theme and density:** Pearl Light is the HMS theme. Density can be Compact, Standard or Comfortable.
- **Avoid:** admin templates, clutter, excessive glass, nested cards, dark overlays, text collisions, tiny controls, broken responsive layouts.
- **Marketing backgrounds:** a soft gradient of BinGi red with blue/sky.
- **Logo:** always use the official BinGi logo; never redraw it.
- **References he likes:** Hostinger hPanel contrast is a good reference.
  - Gradients only in the hero, plan highlight, onboarding header and upsell.
  - Glass only on overlays. Bigger radii. Glow only on the primary CTA.
- **Spacing:** use space properly, with less space between buttons.
- **(10 Nov 2026) "Coral Glow"** is the public-site pricing look applied system-wide: red-gradient buttons, coral blush chips, a highlight card.
- **(11 Nov 2026) Bookings UI:**
  - He dislikes opening side drawers again and again. Use one page with tabs on top (like the live HMS Manage Booking).
  - He prefers the live 4-step booking flow (with meals & services), made cleaner and easier.
- **(11 Nov 2026) Brand Kit V1:**
  - The kit is at /Users/neonecy/BinGi/BinGi-Brand-Kit-V1.
  - Use only its logos and assets, never its colour palette or fonts ("colour e haat diyo na"). The previous colours stay.

## BinGi AI mascot
- A friendly futuristic robotic fennec fox:
  - Pearl-white body.
  - Coral inner ears.
  - Black visor with glowing coral eyes.
  - White tail with a coral tip.
- It is for onboarding, tutorials and ads; it must not dominate the operational UI.

## Workflow
- (10 Nov 2026) Figma is dropped. Everything is built in code with Claude Code.
- Plan → text diagram → build → test → targeted fix.
- Developer handoff: separate short frontend and backend blueprints.

## Public site design
- Follow the 21st.dev Theme Editor token pattern, light preset.
- Apple-smooth motion, with some Telegram-style motion.
- Phone UI is smaller and dense.
- Delivered in rounds: build → test → v2 → test → v3.

## Hotel luxury themes
- v1 (10 themes) was rejected.
- v2: one flagship (ISLE) with real WebGL 3D and its own fonts per theme. Home, Rooms and Room detail pages are owned by each theme.
