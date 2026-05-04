import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDirs = [join(here, "claude/server"), join(here, "codex/server")];

const mcpPackageJson = JSON.parse(
  await readFile(join(here, "../mcp/package.json"), "utf-8"),
) as { version: string };

for (const outputDir of outputDirs) {
  await mkdir(outputDir, { recursive: true });
}

for (const outputDir of outputDirs) {
  const bundle = await Bun.build({
    entrypoints: [join(here, "../mcp/src/index.ts")],
    outdir: outputDir,
    target: "node",
    naming: "threadcast-mcp.js",
    format: "esm",
    define: {
      "process.env.THREADCAST_MCP_VERSION": JSON.stringify(mcpPackageJson.version),
    },
  });

  if (!bundle.success) {
    for (const log of bundle.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}
