type CommandStep = {
  label: string;
  command: string[];
};

const codexProdConfigPath = "packages/plugin-threadcast/codex/.mcp.prod.json";
const codexConfigPath = "packages/plugin-threadcast/codex/.mcp.json";

const runStep = async ({ label, command }: CommandStep) => {
  console.log(`\n${label}`);

  const proc = Bun.spawn(command, {
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${exitCode}`);
  }
};

const copyCodexProdConfig = async () => {
  const source = Bun.file(codexProdConfigPath);

  if (!(await source.exists())) {
    throw new Error(`Missing ${codexProdConfigPath}`);
  }

  await Bun.write(codexConfigPath, source);
  console.log(`\nCopied ${codexProdConfigPath} to ${codexConfigPath}`);
};

const main = async () => {
  await runStep({
    label: "Build plugin MCP bundles",
    command: ["bun", "build:plugin"],
  });

  await copyCodexProdConfig();

  await runStep({
    label: "Validate Claude marketplace",
    command: ["claude", "plugin", "validate", "."],
  });

  console.log("\nPlugin distribution prep complete.");
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

export {};
