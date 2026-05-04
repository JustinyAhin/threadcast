import {
  API_BASE_URL as DEFAULT_API_BASE_URL,
  type AuthConfig,
} from "@threadcast/shared";
import open from "open";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { saveConfig } from "./config.js";
import type { LocalAuthExchangeResponse } from "../types.js";

const API_BASE_URL = process.env.THREADCAST_API_URL || DEFAULT_API_BASE_URL;
const LOGIN_TIMEOUT_MS = 120_000;

type CallbackResult = {
  code: string;
};

const randomState = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const sendHtml = (opts: {
  res: ServerResponse;
  status: number;
  title: string;
  message: string;
}) => {
  opts.res.writeHead(opts.status, {
    "Content-Type": "text/html; charset=utf-8",
  });
  opts.res.end(
    `<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title></head><body><h1>${opts.title}</h1><p>${opts.message}</p></body></html>`,
  );
};

const waitForCallback = async (opts: {
  state: string;
}): Promise<{
  callbackUrl: string;
  result: Promise<CallbackResult>;
  close: () => Promise<void>;
}> => {
  let resolveResult: (result: CallbackResult) => void = () => undefined;
  let rejectResult: (error: Error) => void = () => undefined;

  const result = new Promise<CallbackResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/callback") {
      sendHtml({
        res,
        status: 404,
        title: "ThreadCast login",
        message: "Unknown local login route.",
      });
      return;
    }

    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    if (state !== opts.state || !code) {
      sendHtml({
        res,
        status: 400,
        title: "ThreadCast login failed",
        message:
          "The local login response was invalid. You can close this tab.",
      });
      rejectResult(new Error("Invalid local login callback"));
      return;
    }

    sendHtml({
      res,
      status: 200,
      title: "ThreadCast login complete",
      message: "You can close this tab and return to Claude Code.",
    });
    resolveResult({ code });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;
  return {
    callbackUrl: `http://127.0.0.1:${address.port}/callback`,
    result,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
};

const exchangeLocalAuthCode = async (code: string): Promise<AuthConfig> => {
  const res = await fetch(`${API_BASE_URL}/api/local-auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error(`Local login exchange failed: ${res.statusText}`);
  }

  const auth = (await res.json()) as LocalAuthExchangeResponse;
  return {
    threadcastToken: auth.token,
    githubId: auth.githubId,
    githubUsername: auth.githubUsername,
    githubAvatarUrl: auth.githubAvatarUrl,
    expiresAt: auth.expiresAt,
  };
};

const isHeadlessEnvironment = (): boolean => {
  if (process.platform !== "linux") return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
};

const loginWithBrowser = async (): Promise<AuthConfig> => {
  if (isHeadlessEnvironment()) {
    throw new Error("Headless environment detected; falling back to device flow.");
  }

  const state = randomState();
  const callback = await waitForCallback({ state });
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("ThreadCast browser login timed out.")),
      LOGIN_TIMEOUT_MS,
    );
  });

  try {
    const loginUrl = new URL("/local-login", API_BASE_URL);
    loginUrl.searchParams.set("callback", callback.callbackUrl);
    loginUrl.searchParams.set("state", state);

    await open(loginUrl.toString());
    const { code } = await Promise.race([callback.result, timeout]);
    const auth = await exchangeLocalAuthCode(code);
    await saveConfig(auth);
    return auth;
  } finally {
    await callback.close().catch(() => undefined);
  }
};

export { loginWithBrowser };
