import { loadConfig } from "../auth/config.js";
import { getSessionShareKey } from "../lib/session-source.js";
import { getCachedThread } from "../lib/thread-cache.js";
import { saveSharedSession } from "../lib/shared-sessions.js";
import { selectSession } from "../lib/session-selector.js";
import type { ShareSessionOptions, ShareSessionResult } from "../types.js";
import { uploadThread } from "../uploader/api-client.js";

const shareSession = async (
  opts: ShareSessionOptions = {}
): Promise<ShareSessionResult> => {
  const config = await loadConfig();
  if (!config) {
    throw new Error("Authentication required");
  }

  const selection = await selectSession({
    sessionId: opts.sessionId,
    source: opts.source,
    projectPath: opts.projectPath,
    cwdProjectPath: opts.cwdProjectPath,
  });

  if (!selection.session) {
    throw new Error("No matching Claude Code or Codex session found");
  }

  const shareKey = getSessionShareKey({
    source: selection.session.source,
    sessionId: selection.session.sessionId,
  });

  const data = await getCachedThread({
    filePath: selection.session.path,
    source: selection.session.source,
    uploader: {
      githubUsername: config.githubUsername,
      githubAvatarUrl: config.githubAvatarUrl,
    },
  });

  const result = await uploadThread({
    threadData: data,
    token: config.threadcastToken,
  });

  await saveSharedSession({
    sessionId: shareKey,
    url: result.url,
  });

  return {
    id: result.id,
    url: result.url,
    sessionId: selection.session.sessionId,
    source: selection.session.source,
    title: data.metadata.title,
  };
};

export { shareSession };
