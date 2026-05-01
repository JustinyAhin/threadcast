import type { SessionSummary } from "@threadcast/shared";
import { discoverSessions, findSession } from "./session-discovery.js";
import type { SelectSessionOptions, SelectSessionResult } from "../types.js";

const listRecentSessions = async (opts: {
  limit?: number;
  projectPath?: string;
} = {}): Promise<SessionSummary[]> => {
  const sessions = await discoverSessions();
  const filtered = opts.projectPath
    ? sessions.filter((session) => session.projectPath === opts.projectPath)
    : sessions;
  return filtered.slice(0, opts.limit ?? 10);
};

const selectSession = async (
  opts: SelectSessionOptions = {}
): Promise<SelectSessionResult> => {
  if (opts.sessionId) {
    const session = await findSession(opts.sessionId);
    return { session, selector: session ? "sessionId" : "none" };
  }

  const sessions = await discoverSessions();
  if (sessions.length === 0) {
    return { session: null, selector: "none" };
  }

  if (opts.projectPath) {
    const session = sessions.find((item) => item.projectPath === opts.projectPath) ?? null;
    return { session, selector: session ? "projectPath" : "none" };
  }

  if (opts.cwdProjectPath) {
    const session = sessions.find((item) => item.projectPath === opts.cwdProjectPath) ?? null;
    if (session) {
      return { session, selector: "cwd" };
    }
  }

  return { session: sessions[0] ?? null, selector: sessions[0] ? "latest" : "none" };
};

export { selectSession, listRecentSessions };
