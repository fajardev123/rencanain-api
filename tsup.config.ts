import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  target: "node18",
  format: ["cjs"],
  sourcemap: true,
  clean: true,
});
