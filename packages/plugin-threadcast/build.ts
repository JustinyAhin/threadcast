import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDirs = [join(here, "claude/server"), join(here, "codex/server")];

for (const outputDir of outputDirs) {
  await mkdir(outputDir, { recursive: true });
}

for (const outputDir of outputDirs) {
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
}
