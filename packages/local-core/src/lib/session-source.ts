import type { SessionSource } from "@threadcast/shared";

const getSessionShareKey = (opts: {
  source: SessionSource;
  sessionId: string;
}): string => `${opts.source}:${opts.sessionId}`;

const isSessionSource = (value: unknown): value is SessionSource =>
  value === "claude-code" || value === "codex";

export { getSessionShareKey, isSessionSource };
