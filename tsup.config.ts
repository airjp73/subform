import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/adapters/zod.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm", "cjs"],
  define: {
    "import.meta.vitest": "undefined",
  },
  outExtension({ format }) {
    return { js: `.${format}.js` };
  },
});
