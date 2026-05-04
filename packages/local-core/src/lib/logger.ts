import { appendFile, mkdir, readFile, rename, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getConfigDir } from "../auth/config.js";

const MAX_LOG_BYTES = 1_000_000;

type LogLevel = "info" | "warn" | "error";

type LogFields = {
  level?: LogLevel;
  event: string;
  [key: string]: unknown;
};

const getLogPath = () => join(getConfigDir(), "logs", "mcp.log");

const rotateIfNeeded = async (path: string): Promise<void> => {
  try {
    const info = await stat(path);
    if (info.size < MAX_LOG_BYTES) return;
    await rename(path, `${path}.1`).catch(() => undefined);
  } catch {
    // file does not exist yet; nothing to rotate
  }
};

const log = async (fields: LogFields): Promise<void> => {
  const path = getLogPath();
  const payload = {
    ts: new Date().toISOString(),
    level: fields.level ?? "info",
    ...fields,
  };
  const line = `${JSON.stringify(payload)}\n`;
  try {
    await mkdir(dirname(path), { recursive: true });
    await rotateIfNeeded(path);
    await appendFile(path, line, "utf-8");
  } catch {
    // logger failures must never crash the server
  }
};

const logSync = (fields: LogFields): void => {
  void log(fields);
};

const readRecentLogLines = async (opts: { count: number }): Promise<string[]> => {
  const path = getLogPath();
  try {
    const text = await readFile(path, "utf-8");
    const lines = text.split("\n").filter((line) => line.length > 0);
    return lines.slice(-opts.count);
  } catch {
    return [];
  }
};

export { log, logSync, readRecentLogLines, getLogPath, type LogFields, type LogLevel };
