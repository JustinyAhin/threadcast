import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AuthConfig } from "@threadcast/shared";

const CONFIG_DIR = join(homedir(), ".threadcast");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const loadConfig = async (): Promise<AuthConfig | null> => {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as AuthConfig;
  } catch {
    return null;
  }
};

const saveConfig = async (config: AuthConfig): Promise<void> => {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
};

const clearConfig = async (): Promise<void> => {
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(CONFIG_FILE);
  } catch {
    // Already gone
  }
};

export { loadConfig, saveConfig, clearConfig };
