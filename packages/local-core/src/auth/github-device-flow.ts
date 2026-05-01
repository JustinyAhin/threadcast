import {
  API_BASE_URL as DEFAULT_API_BASE_URL,
  GITHUB_CLIENT_ID,
  type AuthConfig,
} from "@threadcast/shared";
import open from "open";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getConfigDir, saveConfig } from "./config.js";
import type {
  LocalAuthExchangeResponse,
  PendingDeviceLogin,
  PendingLoginAdvanceResult,
} from "../types.js";

type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

type TokenErrorResponse = {
  error: string;
  error_description?: string;
};

type GitHubUser = {
  login: string;
  avatar_url: string;
};

const PENDING_DEVICE_LOGIN_FILE = join(getConfigDir(), "pending-device-login.json");
const API_BASE_URL = process.env.THREADCAST_API_URL || DEFAULT_API_BASE_URL;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type PollForTokenOpts = {
  deviceCode: string;
  interval: number;
  expiresIn: number;
};

const requestDeviceAccessToken = async (
  deviceCode: string
): Promise<TokenResponse | TokenErrorResponse> => {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });

  return (await res.json()) as TokenResponse | TokenErrorResponse;
};

const exchangeGitHubTokenForLocalAuth = async (
  githubToken: string
): Promise<AuthConfig> => {
  const res = await fetch(`${API_BASE_URL}/api/local-auth/device-exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ githubToken }),
  });

  if (!res.ok) {
    throw new Error(`Device login exchange failed: ${res.statusText}`);
  }

  const auth = (await res.json()) as LocalAuthExchangeResponse;
  return {
    threadcastToken: auth.token,
    githubUsername: auth.githubUsername,
    githubAvatarUrl: auth.githubAvatarUrl,
    expiresAt: auth.expiresAt,
  };
};

const buildAndSaveAuthConfig = async (token: string): Promise<AuthConfig> => {
  const auth = await exchangeGitHubTokenForLocalAuth(token);

  await saveConfig(auth);
  await clearPendingDeviceLogin();

  return auth;
};

const pollForToken = async (opts: PollForTokenOpts): Promise<string> => {
  const deadline = Date.now() + opts.expiresIn * 1000;
  const pollInterval = Math.max(opts.interval, 5) * 1000;

  while (Date.now() < deadline) {
    await sleep(pollInterval);
    const data = await requestDeviceAccessToken(opts.deviceCode);

    if ("access_token" in data) {
      return data.access_token;
    }

    if ("error" in data) {
      if (data.error === "authorization_pending") continue;
      if (data.error === "slow_down") {
        await sleep(5000);
        continue;
      }
      if (data.error === "expired_token") {
        throw new Error("Device code expired. Please try again.");
      }
      if (data.error === "access_denied") {
        throw new Error("Authorization was denied.");
      }
      throw new Error(
        `OAuth error: ${data.error} - ${data.error_description || ""}`
      );
    }
  }

  throw new Error("Device code expired. Please try again.");
};

const savePendingDeviceLogin = async (pending: PendingDeviceLogin): Promise<void> => {
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(PENDING_DEVICE_LOGIN_FILE, JSON.stringify(pending, null, 2), {
    mode: 0o600,
  });
};

const readPendingDeviceLogin = async (): Promise<PendingDeviceLogin | null> => {
  try {
    const raw = await readFile(PENDING_DEVICE_LOGIN_FILE, "utf-8");
    return JSON.parse(raw) as PendingDeviceLogin;
  } catch {
    return null;
  }
};

const getValidPendingDeviceLogin = async (): Promise<PendingDeviceLogin | null> => {
  const pending = await readPendingDeviceLogin();
  if (!pending) return null;

  const createdAt = new Date(pending.createdAt).getTime();
  const deadline = createdAt + pending.expiresIn * 1000;
  if (Number.isFinite(deadline) && Date.now() >= deadline) {
    await clearPendingDeviceLogin();
    return null;
  }

  return pending;
};

const loadPendingDeviceLogin = async (): Promise<PendingDeviceLogin | null> =>
  getValidPendingDeviceLogin();

const clearPendingDeviceLogin = async (): Promise<void> => {
  try {
    await unlink(PENDING_DEVICE_LOGIN_FILE);
  } catch {
    // Already gone
  }
};

const startGitHubDeviceFlow = async (): Promise<PendingDeviceLogin> => {
  const deviceRes = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: "read:user",
    }),
  });

  if (!deviceRes.ok) {
    throw new Error(`Failed to request device code: ${deviceRes.statusText}`);
  }

  const deviceData = (await deviceRes.json()) as DeviceCodeResponse;
  const pending: PendingDeviceLogin = {
    deviceCode: deviceData.device_code,
    userCode: deviceData.user_code,
    verificationUri: deviceData.verification_uri,
    expiresIn: deviceData.expires_in,
    interval: deviceData.interval,
    createdAt: new Date().toISOString(),
  };

  await savePendingDeviceLogin(pending);

  try {
    await open(deviceData.verification_uri);
  } catch {
    // User will need to open manually
  }

  return pending;
};

const finishGitHubDeviceFlow = async (
  pending: PendingDeviceLogin
): Promise<AuthConfig> => {
  const token = await pollForToken({
    deviceCode: pending.deviceCode,
    interval: pending.interval,
    expiresIn: pending.expiresIn,
  });

  return buildAndSaveAuthConfig(token);
};

const completePendingGitHubDeviceFlow = async (): Promise<AuthConfig> => {
  const pending = await getValidPendingDeviceLogin();
  if (!pending) {
    throw new Error("No pending ThreadCast login. Start with /threadcast:login first.");
  }

  const createdAt = new Date(pending.createdAt).getTime();
  const deadline = createdAt + pending.expiresIn * 1000;
  if (Number.isFinite(deadline) && Date.now() >= deadline) {
    await clearPendingDeviceLogin();
    throw new Error("The pending login expired. Start /threadcast:login again.");
  }

  const remainingSeconds = Math.max(
    1,
    Math.floor((deadline - Date.now()) / 1000)
  );

  return finishGitHubDeviceFlow({
    ...pending,
    expiresIn: remainingSeconds,
  });
};

const advancePendingGitHubDeviceFlow = async (): Promise<PendingLoginAdvanceResult> => {
  const pending = await getValidPendingDeviceLogin();
  if (!pending) {
    throw new Error("No pending ThreadCast login. Start with /threadcast:login first.");
  }

  const data = await requestDeviceAccessToken(pending.deviceCode);

  if ("access_token" in data) {
    const auth = await buildAndSaveAuthConfig(data.access_token);
    return { status: "complete", auth };
  }

  if (data.error === "authorization_pending" || data.error === "slow_down") {
    return { status: "pending", pending };
  }

  if (data.error === "expired_token") {
    await clearPendingDeviceLogin();
    throw new Error("The pending login expired. Run /threadcast:login again.");
  }

  if (data.error === "access_denied") {
    await clearPendingDeviceLogin();
    throw new Error("Authorization was denied. Run /threadcast:login to start again.");
  }

  throw new Error(
    `OAuth error: ${data.error} - ${data.error_description || ""}`
  );
};

const githubDeviceFlow = async (
  onUserCode: (code: string, verificationUri: string) => void
): Promise<AuthConfig> => {
  const pending = await startGitHubDeviceFlow();
  onUserCode(pending.userCode, pending.verificationUri);
  return finishGitHubDeviceFlow(pending);
};

const getGitHubUser = async (token: string): Promise<GitHubUser> => {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get GitHub user: ${res.statusText}`);
  }

  return (await res.json()) as GitHubUser;
};

export { githubDeviceFlow, getGitHubUser };
export {
  startGitHubDeviceFlow,
  loadPendingDeviceLogin,
  clearPendingDeviceLogin,
  completePendingGitHubDeviceFlow,
  advancePendingGitHubDeviceFlow,
};
