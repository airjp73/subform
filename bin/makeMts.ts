import * as path from "path";

const distFolder = path.resolve(__dirname, "../dist");
const declarations = new Bun.Glob("**/*.d.ts");

for await (const file of declarations.scan(distFolder)) {
  const fullPath = path.join(distFolder, file);
  Bun.spawn(["cp", fullPath, fullPath.replace(/\.d\.ts$/, ".d.mts")]);
}
