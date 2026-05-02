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
        // Avoid Rollup's default behaviour of injecting side-effect
        // `import "./other-chunk.js"` statements into entry chunks for
        // every transitive dynamic dependency. Without this, the route
        // chunk for /app pulled in the Tiptap chunk synchronously even
        // though the only path to Tiptap is a dynamic import behind the
        // task-modal Suspense boundary. Disabling the hoist forces the
        // dynamic import to actually fire on demand.
        hoistTransitiveImports: false,
        // Manual chunk strategy: keep the React+Router+Query trio in a single
        // "vendor" chunk that's cached aggressively across deploys, and pull
        // out the heavy editor/dnd/icon libraries into their own chunks so
        // routes that don't use them never download them.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // Be specific about which `react` modules go in react-core —
          // a naive `/react/` includes() match also captures `@tiptap/react`
          // and other libraries with a /react/ segment, which sucks them
          // into react-core and creates a chunk cycle with their original
          // package family.
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "react-core";
          }
          if (
            id.includes("/react-helmet-async/") ||
            id.includes("/react-fast-compare/") ||
            id.includes("/invariant/") ||
            id.includes("/shallowequal/")
          ) {
            // react-helmet-async pulls a few small utility modules. Keeping
            // them out of react-core breaks the radix/tiptap/router cycle
            // (those libraries don't depend on helmet at all).
            return "helmet";
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
          if (
            id.includes("@tiptap/") ||
            id.includes("/prosemirror-") ||
            id.includes("/orderedmap/") ||
            id.includes("/rope-sequence/") ||
            id.includes("/w3c-keyname/")
          ) {
            return "tiptap";
          }
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
