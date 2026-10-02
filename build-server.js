// Build script: bundle server.ts → server.mjs (ESM) cho production
import { build } from "esbuild";

await build({
  entryPoints: ["server.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "server.mjs",
  // Tất cả packages trong node_modules đều external — chỉ compile TypeScript
  packages: "external",
  banner: {
    js: `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);`,
  },
});

console.log("✓ server.ts bundled to server.mjs");
