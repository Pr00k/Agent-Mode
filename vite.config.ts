import { defineConfig } from "vite";

/**
 * Vite 8 schema notes (errors we avoid):
 * - host 0.0.0.0 so LAN / preview proxies can reach the server
 * - allowedHosts: true so unknown preview hostnames (*.e2b.app) are not rejected
 * - strictPort: true so Tauri's devUrl always matches
 * - no X-Frame-Options / frame-ancestors lock so this shell can itself be previewed
 * - do NOT proxy or cache arena.ai (breaks recaptcha, OAuth, cookies)
 */
export default defineConfig({
  clearScreen: false,
  server: {
    host: "0.0.0.0",
    port: 1420,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    hmr: { overlay: true },
  },
  preview: {
    host: "0.0.0.0",
    port: 1420,
    strictPort: true,
    allowedHosts: true,
    cors: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2022",
    minify: true,
    sourcemap: false,
    cssCodeSplit: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
    codeSplitting: false,
  },
  appType: "spa",
});
