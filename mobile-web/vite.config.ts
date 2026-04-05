/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/shared": path.resolve(__dirname, "../desktop/src/shared"),
      "@sprout-shared": path.resolve(__dirname, "../desktop/src/shared"),
      "@": "/src",
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  test: {
    environment: "happy-dom",
    globals: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});

