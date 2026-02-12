import { GITHUB_CLIENT_ID, type AuthConfig } from "@threadcast/shared";
import open from "open";

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

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type PollForTokenOpts = {
  deviceCode: string;
  interval: number;
  expiresIn: number;
};

const pollForToken = async (opts: PollForTokenOpts): Promise<string> => {
  const deadline = Date.now() + opts.expiresIn * 1000;
  const pollInterval = Math.max(opts.interval, 5) * 1000;

  while (Date.now() < deadline) {
    await sleep(pollInterval);

    const res = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          device_code: opts.deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      }
    );

    const data = (await res.json()) as TokenResponse | TokenErrorResponse;

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

/**
 * Perform GitHub OAuth Device Flow.
 * Returns the auth config with token and user info.
 */
const githubDeviceFlow = async (
  onUserCode: (code: string, verificationUri: string) => void
): Promise<AuthConfig> => {
  // Step 1: Request device code
  const deviceRes = await fetch(
    "https://github.com/login/device/code",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        scope: "read:user",
      }),
    }
  );

  if (!deviceRes.ok) {
    throw new Error(`Failed to request device code: ${deviceRes.statusText}`);
  }

  const deviceData = (await deviceRes.json()) as DeviceCodeResponse;

  // Step 2: Show the user code
  onUserCode(deviceData.user_code, deviceData.verification_uri);

  // Try to open browser
  try {
    await open(deviceData.verification_uri);
  } catch {
    // User will need to open manually
  }

  // Step 3: Poll for token
  const token = await pollForToken({
    deviceCode: deviceData.device_code,
    interval: deviceData.interval,
    expiresIn: deviceData.expires_in,
  });

  // Step 4: Get user info
  const user = await getGitHubUser(token);

  return {
    githubToken: token,
    githubUsername: user.login,
    githubAvatarUrl: user.avatar_url,
  };
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
