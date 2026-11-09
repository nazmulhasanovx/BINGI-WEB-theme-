# GRAND — stack & how to run

- Next.js 16 (App Router, Cache Components on) · React 19 · TypeScript
- Tailwind CSS v4 + CSS variables (theme tokens in `src/lib/theme.ts`)
- Framer Motion (sheets, spring motion; respects reduced motion) · lucide-react icons
- Fonts self-hosted via Fontsource: Plus Jakarta Sans, Fraunces, Hind Siliguri

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

| URL | What |
|---|---|
| `/` | index |
| `/hotel/azure-bay` | demo hotel (GRAND, Ultra) |
| `/hotel/azure-bay?theme=ocean&preview=1` | preview any of the 10 colour themes + floating picker |
| `/theme-lab` | all 10 themes with computed tokens and contrast ratios |

## Folder map
```
src/app/hotel/[slug]/          hotel routes (layout = theme + header/footer + booking state)
src/components/booking/        search bar, search sheet, booking state
src/components/site/           top bar, header, mobile menu, footer, sticky Book bar
src/components/home/           Home sections
src/components/rooms/          room card (reused in B2)
src/lib/theme.ts               10 themes + contrast guard
src/lib/data.ts                data adapter (demo now → HMS API later)
src/data/azure-bay.ts          DEMO data (fictional)
```

Demo photos in `public/demo/azure-bay/` are cropped from the GRAND reference screens — replace with hotel uploads.
