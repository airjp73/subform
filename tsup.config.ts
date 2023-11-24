import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/zod/index.ts", "src/react/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm", "cjs"],
  define: {
    "import.meta.vitest": "undefined",
  },
  noExternal: ["zustand"],
  bundle: true,
  external: ["react", "react-dom", "zod"],
});
