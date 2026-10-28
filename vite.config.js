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
    // The editor chunk (TipTap) is large but lazy-loaded, so the advisory
    // 500 kB warning doesn't apply to it.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing libraries into their own cached chunks.
        // The editor + markdown chunks are only fetched when an entry editor is
        // actually opened (EntryEditor is lazy-loaded), so first paint and the
        // lock screen stay light. React stays in its own chunk shared by both.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "editor";
          if (id.includes("marked") || id.includes("turndown")) return "markdown";
          if (id.includes("react") || id.includes("/scheduler/")) return "react";
          return "vendor";
        },
      },
    },
  },
});
