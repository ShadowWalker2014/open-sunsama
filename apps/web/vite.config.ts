import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mdx({
      jsxRuntime: "automatic",
      remarkPlugins: [remarkGfm],
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true, // Listen on all interfaces for mobile dev
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  // Pre-bundle the heavy deps that the app shell imports synchronously so the
  // dev server doesn't pay the cost on every hard refresh.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@tanstack/react-query",
      "@tanstack/react-router",
      "@tanstack/react-virtual",
      "@tanstack/react-query-persist-client",
      "@tanstack/query-sync-storage-persister",
      "date-fns",
      "lucide-react",
    ],
  },
  build: {
    sourcemap: true,
    // Modern targets only — Tauri ships its own webview, and the web build
    // already requires evergreen browsers. This shaves transpilation overhead.
    target: "es2022",
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Manual chunk strategy: keep the React+Router+Query trio in a single
        // "vendor" chunk that's cached aggressively across deploys, and pull
        // out the heavy editor/dnd/icon libraries into their own chunks so
        // routes that don't use them never download them.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("/react-helmet-async/")
          ) {
            return "react-core";
          }
          if (id.includes("@tanstack/react-router")) return "tanstack-router";
          if (
            id.includes("@tanstack/react-query") ||
            id.includes("@tanstack/query") ||
            id.includes("@tanstack/react-query-persist-client")
          ) {
            return "tanstack-query";
          }
          if (id.includes("@tanstack/react-virtual")) return "virtual";
          if (id.includes("@tiptap/")) return "tiptap";
          if (id.includes("prosemirror-")) return "tiptap";
          if (id.includes("@dnd-kit/")) return "dnd";
          if (id.includes("@radix-ui/")) return "radix";
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("dompurify")) return "sanitize";
          if (id.includes("canvas-confetti")) return "confetti";
          if (id.includes("ky/")) return "http";
          if (id.includes("remark-") || id.includes("@mdx-js/")) {
            return "mdx";
          }
          return undefined;
        },
      },
    },
  },
});
