import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "server");
await mkdir(outputDir, { recursive: true });

const bundle = await Bun.build({
  entrypoints: [join(here, "../mcp/src/index.ts")],
  outdir: outputDir,
  target: "bun",
  naming: "threadcast-mcp.js",
  format: "esm",
});

if (!bundle.success) {
  for (const log of bundle.logs) {
    console.error(log);
  }
  process.exit(1);
}
