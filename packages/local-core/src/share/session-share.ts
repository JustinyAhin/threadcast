import { loadConfig } from "../auth/config.js";
import { getCachedThread } from "../lib/thread-cache.js";
import { loadSharedSessions, saveSharedSession } from "../lib/shared-sessions.js";
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
    projectPath: opts.projectPath,
    cwdProjectPath: opts.cwdProjectPath,
  });

  if (!selection.session) {
    throw new Error("No matching Claude Code session found");
  }

  const shared = await loadSharedSessions();
  const existing = shared[selection.session.sessionId];
  if (existing && !opts.force) {
    return {
      id: selection.session.sessionId,
      url: existing.url,
      sessionId: selection.session.sessionId,
      title: selection.session.firstMessage,
      previouslyShared: true,
    };
  }

  const data = await getCachedThread({
    filePath: selection.session.path,
    uploader: {
      githubUsername: config.githubUsername,
      githubAvatarUrl: config.githubAvatarUrl,
    },
  });

  const result = await uploadThread({
    threadData: data,
    token: config.githubToken,
  });

  await saveSharedSession({
    sessionId: selection.session.sessionId,
    url: result.url,
  });

  return {
    id: result.id,
    url: result.url,
    sessionId: selection.session.sessionId,
    title: data.metadata.title,
    previouslyShared: false,
  };
};

export { shareSession };
