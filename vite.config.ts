import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const VENDOR_CHUNKS: Record<string, string[]> = {
  "vendor-react": ["react", "react-dom", "react-router-dom"],
  "vendor-radix": [
    "@radix-ui/react-accordion", "@radix-ui/react-alert-dialog",
    "@radix-ui/react-avatar", "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible", "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu", "@radix-ui/react-label",
    "@radix-ui/react-popover", "@radix-ui/react-progress",
    "@radix-ui/react-radio-group", "@radix-ui/react-scroll-area",
    "@radix-ui/react-select", "@radix-ui/react-separator",
    "@radix-ui/react-slider", "@radix-ui/react-slot",
    "@radix-ui/react-switch", "@radix-ui/react-tabs",
    "@radix-ui/react-toast", "@radix-ui/react-toggle",
    "@radix-ui/react-toggle-group", "@radix-ui/react-tooltip",
  ],
  "vendor-data": ["@tanstack/react-query", "react-hook-form", "@hookform/resolvers", "zod"],
  "vendor-supabase": ["@supabase/supabase-js"],
  "vendor-ui": ["framer-motion", "recharts", "embla-carousel-react", "embla-carousel"],
  "vendor-icons": ["lucide-react"],
  "vendor-forms": ["react-day-picker", "react-resizable-panels", "cmdk", "input-otp"],
  "vendor-utils": ["date-fns", "clsx", "class-variance-authority", "tailwind-merge", "next-themes", "sonner", "vaul"],
};

// Build reverse lookup: package id prefix → chunk name
const MODULE_TO_CHUNK: Record<string, string> = {};
for (const [chunk, pkgs] of Object.entries(VENDOR_CHUNKS)) {
  for (const pkg of pkgs) {
    MODULE_TO_CHUNK[pkg] = chunk;
  }
}

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          for (const [pkg, chunk] of Object.entries(MODULE_TO_CHUNK)) {
            if (id.includes(`node_modules/${pkg}`)) return chunk;
          }
          return "vendor-misc";
        },
      },
    },
  },
});
