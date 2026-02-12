import solidPlugin from "@opentui/solid/bun-plugin";

const result = await Bun.build({
  entrypoints: ["src/index.tsx"],
  outdir: "bin",
  target: "bun",
  plugins: [solidPlugin],
  naming: "threadcast.js",
  external: ["@opentui/core-darwin-arm64", "@opentui/core-darwin-x64", "@opentui/core-linux-x64", "@opentui/core-linux-arm64"],
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
