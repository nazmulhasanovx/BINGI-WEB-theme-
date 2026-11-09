# Single-file preview build

Builds the GRAND theme into ONE self-contained `index.html` (hash routing, images and fonts inlined) so it can be viewed as a claude.ai artifact or opened from disk.

```bash
cd preview
npm i -D vite @vitejs/plugin-react vite-plugin-singlefile @tailwindcss/vite tailwindcss
npm i framer-motion lucide-react clsx @fontsource-variable/plus-jakarta-sans @fontsource-variable/fraunces @fontsource/hind-siliguri react@19.3.0 react-dom@19.3.0
npx vite build      # → preview/dist/index.html
```
`shim/` replaces next/link, next/image and next/navigation for this build only. The real app is unchanged.
