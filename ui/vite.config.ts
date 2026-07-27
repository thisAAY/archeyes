import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds a single self-contained index.html (JS + CSS inlined) into dist/ui,
// which the archeyes CLI server serves. "Zero build step for end users."
export default defineConfig({
  root: ".",
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
