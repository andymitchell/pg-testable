import { defineConfig } from "tsup";
 
export default defineConfig({
  entry: ["src/index.ts"],
  publicDir: false,
  clean: true,
  minify: false,
  format: ['cjs'], // When this changes, update 'type' in package.json 
});