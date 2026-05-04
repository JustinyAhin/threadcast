import {
  advancePendingGitHubDeviceFlow,
  clearConfig,
  clearPendingDeviceLogin,
  listRecentSessions,
  loginWithBrowser,
  loadConfig,
  loadPendingDeviceLogin,
  shareSession,
  startGitHubDeviceFlow,
  isSessionSource,
  log,
  logSync,
  readRecentLogLines,
  getLogPath,
} from "@threadcast/local-core";
import { getConfigDir } from "@threadcast/local-core";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

type JsonRpcId = string | number;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcNotification = {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
};

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const PROTOCOL_VERSION = "2025-03-26";
const MCP_VERSION = process.env.THREADCAST_MCP_VERSION || "0.0.0-dev";
const SERVER_INFO = {
  name: "threadcast-local",
  version: MCP_VERSION,
};

const tools: Tool[] = [
  {
    name: "threadcast.status",
    title: "ThreadCast Status",
    description: "Show login state and the latest local Claude Code or Codex session for this project.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "threadcast.login",
    title: "ThreadCast Login",
    description: "Log in to ThreadCast by opening a browser and waiting for approval.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "threadcast.logout",
    title: "ThreadCast Logout",
    description: "Clear the local ThreadCast credentials.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "threadcast.list_recent_sessions",
    title: "List Recent Sessions",
    description:
      "List recent local Claude Code and Codex sessions for the current project by default, optionally filtered to a source or project path.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 50 },
        source: { type: "string", enum: ["claude-code", "codex"] },
        projectPath: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "threadcast.share_session",
    title: "Share Session",
    description: "Share a local Claude Code or Codex session to ThreadCast using saved credentials.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        source: { type: "string", enum: ["claude-code", "codex"] },
        projectPath: { type: "string" },
        latest: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "threadcast.debug",
    title: "ThreadCast Debug",
    description:
      "Print a diagnostic dump (plugin version, runtime info, env summary, config dir contents, recent MCP server log lines) for support and bug reports.",
    inputSchema: {
      type: "object",
      properties: {
        logLines: { type: "number", minimum: 1, maximum: 1000 },
      },
      additionalProperties: false,
    },
  },
];

const sendResponse = ({
  id,
  result,
}: {
  id: JsonRpcId;
  result: Record<string, unknown>;
}) => {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
};

const sendError = ({
  id,
  code,
  message,
  data,
}: {
  id: JsonRpcId | null;
  code: number;
  message: string;
  data?: unknown;
}) => {
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } })}\n`
  );
};

const textResult = ({
  text,
  structuredContent,
  isError,
}: {
  text: string;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}) => ({
  content: [{ type: "text", text }],
  structuredContent,
  isError,
});

const resolveDefaultProjectPath = () => process.cwd();

const formatSource = (source: string) => (source === "codex" ? "Codex" : "Claude Code");

const handleToolCall = async ({
  name,
  args,
}: {
  name: string;
  args: Record<string, unknown> | undefined;
}) => {
  switch (name) {
    case "threadcast.status": {
      const auth = await loadConfig();
      const pendingLogin = await loadPendingDeviceLogin();
      const latestSessions = await listRecentSessions({
        limit: 1,
        projectPath: resolveDefaultProjectPath(),
      });
      const latestSession = latestSessions[0] ?? (await listRecentSessions({ limit: 1 }))[0] ?? null;
      const structured = {
        authenticated: Boolean(auth),
        githubUsername: auth?.githubUsername,
        configPath: getConfigDir(),
        pendingLogin,
        latestSession,
      };
      return textResult({
        text: auth
          ? `Logged in as @${auth.githubUsername}.${latestSession ? ` Latest session: ${latestSession.firstMessage}` : " No sessions found."}`
          : pendingLogin
            ? `Device login pending. Open ${pendingLogin.verificationUri} and enter code ${pendingLogin.userCode}, then run /threadcast:login again after approving in GitHub.`
            : "Not logged in to ThreadCast.",
        structuredContent: structured,
      });
    }
    case "threadcast.login": {
      const auth = await loadConfig();
      if (auth) {
        return textResult({
          text: `Already logged in as @${auth.githubUsername}.`,
          structuredContent: {
            authenticated: true,
            githubUsername: auth.githubUsername,
            githubAvatarUrl: auth.githubAvatarUrl,
          },
        });
      }

      const pending = await loadPendingDeviceLogin();
      if (!pending) {
        try {
          const browserAuth = await loginWithBrowser();
          return textResult({
            text: `Logged in as @${browserAuth.githubUsername}.`,
            structuredContent: {
              authenticated: true,
              githubUsername: browserAuth.githubUsername,
              githubAvatarUrl: browserAuth.githubAvatarUrl,
              expiresAt: browserAuth.expiresAt,
            },
          });
        } catch {
          const started = await startGitHubDeviceFlow();
          return textResult({
            text: `Browser login could not complete. Open ${started.verificationUri} and enter code ${started.userCode}. After approving in GitHub, run /threadcast:login again.`,
            structuredContent: {
              verificationUri: started.verificationUri,
              userCode: started.userCode,
              expiresIn: started.expiresIn,
              interval: started.interval,
              pending: true,
              fallback: "device",
            },
          });
        }
      }

      const result = await advancePendingGitHubDeviceFlow();
      if (result.status === "pending") {
        return textResult({
          text: `Still waiting for GitHub approval. Open ${result.pending.verificationUri} and enter code ${result.pending.userCode}, then run /threadcast:login again.`,
          structuredContent: {
            verificationUri: result.pending.verificationUri,
            userCode: result.pending.userCode,
            expiresIn: result.pending.expiresIn,
            interval: result.pending.interval,
            pending: true,
          },
        });
      }

      return textResult({
        text: `Logged in as @${result.auth.githubUsername}.`,
        structuredContent: {
          authenticated: true,
          githubUsername: result.auth.githubUsername,
          githubAvatarUrl: result.auth.githubAvatarUrl,
        },
      });
    }
    case "threadcast.logout": {
      await clearConfig();
      await clearPendingDeviceLogin();
      return textResult({
        text: "Logged out of ThreadCast.",
        structuredContent: { success: true },
      });
    }
    case "threadcast.list_recent_sessions": {
      const limit = typeof args?.limit === "number" ? args.limit : 10;
      const rawSource = args?.source;
      const source = isSessionSource(rawSource) ? rawSource : undefined;
      const projectPath =
        typeof args?.projectPath === "string" && args.projectPath.length > 0
          ? args.projectPath
          : resolveDefaultProjectPath();
      const sessions = await listRecentSessions({ limit, source, projectPath });
      return textResult({
        text:
          sessions.length > 0
            ? sessions
                .map(
                  (session, index) =>
                    `${index + 1}. ${formatSource(session.source)} | ${session.sessionId} | ${session.firstMessage} | ${session.projectPath || "(unknown project)"}`
                )
                .join("\n")
            : "No local Claude Code or Codex sessions found for this project folder.",
        structuredContent: { sessions },
      });
    }
    case "threadcast.share_session": {
      const sessionId = typeof args?.sessionId === "string" ? args.sessionId : undefined;
      const rawSource = args?.source;
      const source = isSessionSource(rawSource) ? rawSource : undefined;
      const projectPath = typeof args?.projectPath === "string" ? args.projectPath : undefined;

      try {
        const result = await shareSession({
          sessionId,
          source,
          projectPath,
          cwdProjectPath: !sessionId && !projectPath ? resolveDefaultProjectPath() : undefined,
        });

        return textResult({
          text: `Shared "${result.title}": ${result.url}`,
          structuredContent: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to share session";
        return textResult({
          text: message,
          structuredContent: { error: message },
          isError: true,
        });
      }
    }
    case "threadcast.debug": {
      const requested = typeof args?.logLines === "number" ? args.logLines : 200;
      const logLines = Math.min(Math.max(Math.floor(requested), 1), 1000);
      const dump = await buildDebugDump({ logLines });
      return textResult({
        text: dump.text,
        structuredContent: dump.structured,
      });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};

const summarizeEnv = () => {
  const present = (value: string | undefined) =>
    value === undefined || value === "" ? null : "set";
  return {
    DISPLAY: present(process.env.DISPLAY),
    WAYLAND_DISPLAY: present(process.env.WAYLAND_DISPLAY),
    SSH_TTY: present(process.env.SSH_TTY),
    SSH_CONNECTION: present(process.env.SSH_CONNECTION),
    THREADCAST_API_URL: present(process.env.THREADCAST_API_URL),
    THREADCAST_CONFIG_DIR: present(process.env.THREADCAST_CONFIG_DIR),
  };
};

const listConfigFiles = async () => {
  const configDir = getConfigDir();
  try {
    const entries = await readdir(configDir, { withFileTypes: true });
    const out: { name: string; size: number | null; type: string }[] = [];
    for (const entry of entries) {
      let size: number | null = null;
      try {
        const info = await stat(join(configDir, entry.name));
        size = info.size;
      } catch {
        // ignore stat failures
      }
      out.push({
        name: entry.name,
        size,
        type: entry.isDirectory() ? "dir" : entry.isFile() ? "file" : "other",
      });
    }
    return out;
  } catch {
    return [];
  }
};

const buildDebugDump = async ({ logLines }: { logLines: number }) => {
  const env = summarizeEnv();
  const configDir = getConfigDir();
  const files = await listConfigFiles();
  const recent = await readRecentLogLines({ count: logLines });

  const structured = {
    pluginVersion: MCP_VERSION,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    cwd: process.cwd(),
    configDir,
    logPath: getLogPath(),
    env,
    configDirContents: files,
    recentLogLines: recent,
  };

  const lines: string[] = [];
  lines.push("ThreadCast MCP server diagnostic dump");
  lines.push("");
  lines.push(`Plugin version: ${MCP_VERSION}`);
  lines.push(`Node:           ${process.version}`);
  lines.push(`Platform:       ${process.platform} (${process.arch})`);
  lines.push(`PID:            ${process.pid}`);
  lines.push(`CWD:            ${process.cwd()}`);
  lines.push(`Config dir:     ${configDir}`);
  lines.push(`Log path:       ${getLogPath()}`);
  lines.push("");
  lines.push("Environment (presence only — no values logged):");
  for (const [key, state] of Object.entries(env)) {
    lines.push(`  ${key}: ${state ?? "unset"}`);
  }
  lines.push("");
  lines.push(`Config dir contents (${files.length}):`);
  if (files.length === 0) {
    lines.push("  (empty or missing)");
  } else {
    for (const file of files) {
      const sizeStr = file.size === null ? "?" : `${file.size}`;
      lines.push(`  ${file.name} (${file.type}, ${sizeStr} bytes)`);
    }
  }
  lines.push("");
  lines.push(`Recent log lines (${recent.length}):`);
  if (recent.length === 0) {
    lines.push("  (no log file yet)");
  } else {
    for (const line of recent) {
      lines.push(`  ${line}`);
    }
  }

  return { text: lines.join("\n"), structured };
};

const handleRequest = async (request: JsonRpcRequest) => {
  switch (request.method) {
    case "initialize":
      sendResponse({
        id: request.id,
        result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: SERVER_INFO,
        },
      });
      break;
    case "ping":
      sendResponse({ id: request.id, result: {} });
      break;
    case "tools/list":
      sendResponse({ id: request.id, result: { tools } });
      break;
    case "tools/call": {
      const params = request.params ?? {};
      const name = typeof params.name === "string" ? params.name : "";
      if (!name) {
        sendError({ id: request.id, code: -32602, message: "Tool name is required" });
        return;
      }
      const startedAt = Date.now();
      await log({ event: "tool_call_start", tool: name });
      try {
        const result = await handleToolCall({
          name,
          args:
            typeof params.arguments === "object" && params.arguments !== null
              ? (params.arguments as Record<string, unknown>)
              : undefined,
        });
        sendResponse({ id: request.id, result });
        const isError = (result as { isError?: boolean }).isError === true;
        await log({
          event: "tool_call_end",
          tool: name,
          durationMs: Date.now() - startedAt,
          outcome: isError ? "error" : "ok",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool call failed";
        await log({
          level: "error",
          event: "tool_call_end",
          tool: name,
          durationMs: Date.now() - startedAt,
          outcome: "error",
          error: message,
        });
        sendResponse({
          id: request.id,
          result: textResult({
            text: message,
            structuredContent: { error: message },
            isError: true,
          }),
        });
      }
      break;
    }
    default:
      sendError({
        id: request.id,
        code: -32601,
        message: `Method not found: ${request.method}`,
      });
  }
};

const handleNotification = (_notification: JsonRpcNotification) => {
  // No-op for notifications/initialized and other client notifications.
};

process.on("uncaughtException", (error: Error) => {
  logSync({
    level: "error",
    event: "uncaught_exception",
    error: error.message,
    stack: error.stack,
  });
  console.error("ThreadCast MCP uncaughtException:", error);
  setTimeout(() => process.exit(1), 50).unref();
});

process.on("unhandledRejection", (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logSync({
    level: "error",
    event: "unhandled_rejection",
    error: error.message,
    stack: error.stack,
  });
  console.error("ThreadCast MCP unhandledRejection:", error);
  setTimeout(() => process.exit(1), 50).unref();
});

const start = () => {
  void log({
    event: "server_start",
    pluginVersion: MCP_VERSION,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    cwd: process.cwd(),
    env: {
      DISPLAY: process.env.DISPLAY ? "set" : null,
      WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY ? "set" : null,
      SSH_TTY: process.env.SSH_TTY ? "set" : null,
      SSH_CONNECTION: process.env.SSH_CONNECTION ? "set" : null,
      THREADCAST_API_URL: process.env.THREADCAST_API_URL ? "set" : null,
      THREADCAST_CONFIG_DIR: process.env.THREADCAST_CONFIG_DIR ? "set" : null,
    },
  });

  process.stdin.setEncoding("utf8");
  let buffer = "";
  let pending = Promise.resolve();
  let stdinEnded = false;

  const finishIfDone = () => {
    if (stdinEnded) {
      pending.finally(() => {
        logSync({ event: "server_exit", reason: "stdin_closed" });
        process.exit(0);
      });
    }
  };

  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      pending = pending.then(async () => {
        try {
          const message = JSON.parse(line) as JsonRpcRequest | JsonRpcNotification;
          if ("id" in message) {
            await handleRequest(message);
          } else {
            handleNotification(message);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await log({ level: "warn", event: "invalid_message", error: errorMessage });
          console.error("Invalid MCP message", error);
        }
      });
    }

    finishIfDone();
  });

  process.stdin.on("end", () => {
    void log({ event: "stdin_end" });
    stdinEnded = true;
    finishIfDone();
  });

  process.stdin.on("error", (error: Error) => {
    logSync({ level: "error", event: "stdin_error", error: error.message });
  });
};

start();
