/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

const entry = process.env.ENTRY;
const getFilename = () => {
  if (entry?.includes("zod")) return "zod";
  if (entry?.includes("react")) return "react";
  return "index";
};

const emptyOutDir = !entry?.includes("react") && !entry?.includes("zod");

export default defineConfig({
  build: {
    emptyOutDir,
    lib: {
      entry: entry ?? "src/index.ts",
      name: "subform",
      fileName: (format) =>
        `${getFilename()}.${format === "es" ? "mjs" : "js"}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "zod"],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // We'll use explicity imports in tests, but this is needed for RTL cleanup
    globals: true,
  },
});
