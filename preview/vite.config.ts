import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

const app = path.resolve(__dirname, "../src");
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: path.resolve(__dirname, "shim/link.tsx") },
      { find: "next/image", replacement: path.resolve(__dirname, "shim/image.tsx") },
      { find: "next/navigation", replacement: path.resolve(__dirname, "shim/navigation.ts") },
      { find: "@", replacement: app },
    ],
    dedupe: ["react", "react-dom", "framer-motion", "lucide-react", "clsx"],
  },
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false, chunkSizeWarningLimit: 100000 },
  define: { "process.env.NEXT_PUBLIC_SITE_URL": "undefined" },
});
