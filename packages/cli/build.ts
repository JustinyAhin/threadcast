import solidPlugin from "@opentui/solid/bun-plugin";
import { mkdir, rm } from "node:fs/promises";
import { arch, platform } from "node:os";

const currentTarget = `bun-${platform()}-${arch()}`;
const name = `threadcast-${platform()}-${arch()}`;

// Step 1: Bundle with solid plugin
const bundle = await Bun.build({
  entrypoints: ["src/index.tsx"],
  outdir: ".build-tmp",
  target: "bun",
  plugins: [solidPlugin],
  naming: "threadcast.js",
  external: ["@opentui/core"],
});

if (!bundle.success) {
  for (const log of bundle.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Step 2: Compile standalone binary for current platform
await mkdir("dist", { recursive: true });

const proc = Bun.spawn(
  ["bun", "build", "--compile", "--target", currentTarget, ".build-tmp/threadcast.js", "--outfile", `dist/${name}`],
  { stdout: "inherit", stderr: "inherit" },
);

const code = await proc.exited;
await rm(".build-tmp", { recursive: true, force: true });

if (code !== 0) {
  console.error(`Failed to compile for ${currentTarget}`);
  process.exit(1);
}

console.log(`Built dist/${name}`);
