/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./setup.ts"],
    // We'll use explicity imports in tests, but this is needed for RTL cleanup
    globals: true,
  },
});
