type CommandStep = {
  label: string;
  command: string[];
};

type VersionTarget = {
  label: string;
  path: string;
};

const versionTargets: VersionTarget[] = [
  {
    label: "Plugin package",
    path: "packages/plugin-threadcast/package.json",
  },
  {
    label: "Claude plugin",
    path: "packages/plugin-threadcast/claude/.claude-plugin/plugin.json",
  },
  {
    label: "Codex plugin",
    path: "packages/plugin-threadcast/codex/.codex-plugin/plugin.json",
  },
];

const semverPattern =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

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

const readVersion = async (path: string) => {
  const text = await Bun.file(path).text();
  const data = JSON.parse(text) as { version?: unknown };

  if (typeof data.version !== "string") {
    throw new Error(`${path} does not have a string version field`);
  }

  return data.version;
};

const writeVersion = async ({
  path,
  version,
}: {
  path: string;
  version: string;
}) => {
  const text = await Bun.file(path).text();
  let matched = false;
  const updated = text.replace(
    /("version"\s*:\s*)"[^"]+"/,
    (_match, prefix: string) => {
      matched = true;
      return `${prefix}"${version}"`;
    },
  );

  if (!matched) {
    throw new Error(`Could not update version in ${path}`);
  }

  await Bun.write(path, updated);
};

const parseArgs = () => {
  const args = Bun.argv.slice(2);
  const version = args.find((arg) => !arg.startsWith("--"));
  const versionOnly = args.includes("--version-only");

  if (!version) {
    throw new Error(
      "Usage: bun plugin:release <version> or bun plugin:version <version>",
    );
  }

  if (!semverPattern.test(version)) {
    throw new Error(
      `Invalid version "${version}". Use semver like 0.1.0 or 0.1.0-beta.1.`,
    );
  }

  return { version, versionOnly };
};

const setPluginVersions = async (version: string) => {
  for (const target of versionTargets) {
    const previousVersion = await readVersion(target.path);
    await writeVersion({ path: target.path, version });

    console.log(`${target.label}: ${previousVersion} -> ${version}`);
  }
};

const main = async () => {
  const { version, versionOnly } = parseArgs();

  await setPluginVersions(version);

  if (!versionOnly) {
    await runStep({
      label: "Prepare plugin distribution files",
      command: ["bun", "plugin:prepare:dist"],
    });
  }

  console.log(
    versionOnly
      ? "\nPlugin versions updated."
      : "\nPlugin release files are ready. Commit, tag, and push this version.",
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

export {};
