# Full HMS preview build (claude.ai artifact)

Multi-file SPA of the whole prototype (HMS, onboarding, marketplace listing, hotel websites) on a hash router,
so it runs inside the artifact frame (files are served under a versioned folder, so every path is relative).

- `main.tsx` builds the route table from `src/app/**/page.tsx` (+ layouts, templates, not-found) automatically.
- `shim/` replaces next/link, next/navigation, next/image.
- Build: install `vite@6 @vitejs/plugin-react@4 @tailwindcss/vite@4.3.5` in a separate tools folder, prepare `.public/`
  (public/ with demo photos downscaled to 1400 px), then `npx vite build --config vite.full.ts` from that folder.
- Published as artifact "BinGi HMS — full prototype" (25 Nov 2026). Printing/PDF and downloads are blocked inside the artifact frame.
