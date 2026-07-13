import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base is "./" so the built index.html works when loaded from the
// filesystem by Electron (file://) in production.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
