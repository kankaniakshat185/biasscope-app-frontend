import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

// Component-level unit tests for the "use client" React components in
// src/ — separate from the Next.js app itself (next build/dev never
// touches this file). Uses jsdom so hooks (useState/useEffect) and DOM
// assertions work without a real browser. See AUDIT_TASKS.md R16 — this
// is the first test infrastructure in this repo; there was none before.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
  },
})
