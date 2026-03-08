import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(
      process.env.CF_PAGES_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || `dev-${Date.now()}`
    ),
  },
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks: {
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei", "@react-three/postprocessing", "postprocessing"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/ws": { target: "ws://localhost:3001", ws: true },
    },
  },
});
