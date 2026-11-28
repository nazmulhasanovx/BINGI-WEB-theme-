// Full HMS preview build (multi-file, hash router) for the claude.ai artifact.
// Run from /home/claude/spa-tools:  npx vite build --config <this file>
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const here = "/home/claude/wt/preview/preview/full";
const app = path.resolve(here, "../../src");
const nm = path.resolve(here, "../../node_modules");
// "/demo/x.jpg" → "./demo/x.jpg": the artifact serves files under a versioned folder, so asset paths must be relative.
const relAssets = (): Plugin => ({
  name: "rel-assets",
  enforce: "pre",
  transform(code, id) {
    if (!id.startsWith(app) || !/\.(tsx?|jsx?)$/.test(id)) return null;
    const out = code.replace(/(["'`(])\/(demo|brand|themes|hms-app)\//g, "$1./$2/");
    return out === code ? null : { code: out, map: null };
  },
});
export default defineConfig({
  root: here,
  base: "./",
  publicDir: path.resolve(here, ".public"),
  plugins: [relAssets(), react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "next/link", replacement: path.resolve(here, "shim/link.tsx") },
      { find: "next/image", replacement: path.resolve(here, "shim/image.tsx") },
      { find: "next/navigation", replacement: path.resolve(here, "shim/navigation.ts") },
      { find: /^react$/, replacement: path.join(nm, "react") },
      { find: /^react\/(.*)$/, replacement: path.join(nm, "react") + "/$1" },
      { find: /^react-dom$/, replacement: path.join(nm, "react-dom") },
      { find: /^react-dom\/(.*)$/, replacement: path.join(nm, "react-dom") + "/$1" },
      { find: "@", replacement: app },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: { fs: { allow: [path.resolve(here, "../..")] } },
  build: { outDir: path.resolve(here, "dist"), emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 100000, cssCodeSplit: false, reportCompressedSize: false, rollupOptions: { output: { inlineDynamicImports: true } } },
  define: { "process.env.NEXT_PUBLIC_SITE_URL": "undefined", "process.env.NEXT_PUBLIC_THEME_SWITCHER": "undefined", "process.env.NODE_ENV": '"production"' },
});
