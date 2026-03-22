import {
  advancePendingGitHubDeviceFlow,
  clearConfig,
  clearPendingDeviceLogin,
  listRecentSessions,
  loadConfig,
  loadPendingDeviceLogin,
  shareSession,
  startGitHubDeviceFlow,
} from "@threadcast/local-core";
import { getConfigDir } from "@threadcast/local-core";

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
const SERVER_INFO = {
  name: "threadcast-local",
  version: "0.0.1",
};

const tools: Tool[] = [
  {
    name: "threadcast.status",
    title: "ThreadCast Status",
    description: "Show login state and the latest local Claude Code session for this project.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "threadcast.login",
    title: "ThreadCast Login",
    description: "Start or resume GitHub device login. Run it once to get the code, then run it again after approving in the browser.",
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
    description: "List recent local Claude Code sessions, optionally filtered to a project path.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 50 },
        projectPath: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "threadcast.share_session",
    title: "Share Session",
    description: "Share a local Claude Code session to ThreadCast using the saved GitHub credentials.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        projectPath: { type: "string" },
        latest: { type: "boolean" },
        force: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
];

const sendResponse = (id: JsonRpcId, result: Record<string, unknown>) => {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
};

const sendError = (id: JsonRpcId | null, code: number, message: string, data?: unknown) => {
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } })}\n`
  );
};

const textResult = (
  text: string,
  structuredContent?: Record<string, unknown>,
  isError?: boolean
) => ({
  content: [{ type: "text", text }],
  structuredContent,
  isError,
});

const resolveDefaultProjectPath = () => process.cwd();

const handleToolCall = async (
  name: string,
  args: Record<string, unknown> | undefined
) => {
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
      return textResult(
        auth
          ? `Logged in as @${auth.githubUsername}.${latestSession ? ` Latest session: ${latestSession.firstMessage}` : " No sessions found."}`
          : pendingLogin
            ? `Login pending. Open ${pendingLogin.verificationUri} and enter code ${pendingLogin.userCode}, then run /threadcast:login again after approving in GitHub.`
            : "Not logged in to ThreadCast.",
        structured
      );
    }
    case "threadcast.login": {
      const auth = await loadConfig();
      if (auth) {
        return textResult(
          `Already logged in as @${auth.githubUsername}.`,
          {
            authenticated: true,
            githubUsername: auth.githubUsername,
            githubAvatarUrl: auth.githubAvatarUrl,
          }
        );
      }

      const pending = await loadPendingDeviceLogin();
      if (!pending) {
        const started = await startGitHubDeviceFlow();
        return textResult(
          `Open ${started.verificationUri} and enter code ${started.userCode}. After approving in GitHub, run /threadcast:login again.`,
          {
            verificationUri: started.verificationUri,
            userCode: started.userCode,
            expiresIn: started.expiresIn,
            interval: started.interval,
            pending: true,
          }
        );
      }

      const result = await advancePendingGitHubDeviceFlow();
      if (result.status === "pending") {
        return textResult(
          `Still waiting for GitHub approval. Open ${result.pending.verificationUri} and enter code ${result.pending.userCode}, then run /threadcast:login again.`,
          {
            verificationUri: result.pending.verificationUri,
            userCode: result.pending.userCode,
            expiresIn: result.pending.expiresIn,
            interval: result.pending.interval,
            pending: true,
          }
        );
      }

      return textResult(
        `Logged in as @${result.auth.githubUsername}.`,
        {
          authenticated: true,
          githubUsername: result.auth.githubUsername,
          githubAvatarUrl: result.auth.githubAvatarUrl,
        }
      );
    }
    case "threadcast.logout": {
      await clearConfig();
      await clearPendingDeviceLogin();
      return textResult("Logged out of ThreadCast.", { success: true });
    }
    case "threadcast.list_recent_sessions": {
      const limit = typeof args?.limit === "number" ? args.limit : 10;
      const projectPath =
        typeof args?.projectPath === "string" && args.projectPath.length > 0
          ? args.projectPath
          : resolveDefaultProjectPath();
      const sessions = await listRecentSessions({ limit, projectPath });
      return textResult(
        sessions.length > 0
          ? sessions
              .map(
                (session, index) =>
                  `${index + 1}. ${session.sessionId} | ${session.firstMessage} | ${session.projectPath}`
              )
              .join("\n")
          : "No local Claude Code sessions found.",
        { sessions }
      );
    }
    case "threadcast.share_session": {
      const sessionId = typeof args?.sessionId === "string" ? args.sessionId : undefined;
      const projectPath = typeof args?.projectPath === "string" ? args.projectPath : undefined;
      const force = args?.force === true;

      try {
        const result = await shareSession({
          sessionId,
          projectPath,
          cwdProjectPath: !sessionId && !projectPath ? resolveDefaultProjectPath() : undefined,
          force,
        });

        return textResult(
          result.previouslyShared
            ? `Already shared: ${result.url}`
            : `Shared "${result.title}": ${result.url}`,
          result
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to share session";
        return textResult(message, { error: message }, true);
      }
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};

const handleRequest = async (request: JsonRpcRequest) => {
  switch (request.method) {
    case "initialize":
      sendResponse(request.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: SERVER_INFO,
      });
      break;
    case "ping":
      sendResponse(request.id, {});
      break;
    case "tools/list":
      sendResponse(request.id, { tools });
      break;
    case "tools/call": {
      const params = request.params ?? {};
      const name = typeof params.name === "string" ? params.name : "";
      if (!name) {
        sendError(request.id, -32602, "Tool name is required");
        return;
      }
      try {
        const result = await handleToolCall(
          name,
          typeof params.arguments === "object" && params.arguments !== null
            ? (params.arguments as Record<string, unknown>)
            : undefined
        );
        sendResponse(request.id, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool call failed";
        sendResponse(request.id, textResult(message, { error: message }, true));
      }
      break;
    }
    default:
      sendError(request.id, -32601, `Method not found: ${request.method}`);
  }
};

const handleNotification = (_notification: JsonRpcNotification) => {
  // No-op for notifications/initialized and other client notifications.
};

const start = () => {
  process.stdin.setEncoding("utf8");
  let buffer = "";

  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      try {
        const message = JSON.parse(line) as JsonRpcRequest | JsonRpcNotification;
        if ("id" in message) {
          await handleRequest(message);
        } else {
          handleNotification(message);
        }
      } catch (error) {
        console.error("Invalid MCP message", error);
      }
    }
  });

  process.stdin.on("end", () => {
    process.exit(0);
  });
};

start();
