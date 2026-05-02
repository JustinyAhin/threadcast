import { parseClaudeCodeSession } from "./claude-code.js";
import { parseCodexSession } from "./codex.js";
import type { ThreadData, Uploader, SessionSource } from "@threadcast/shared";

const parseSession = async ({
  filePath,
  source = "claude-code",
  uploader,
}: {
  filePath: string;
  source?: SessionSource;
  uploader: Uploader;
}): Promise<ThreadData> => {
  if (source === "codex") {
    return parseCodexSession({ filePath, uploader });
  }

  return parseClaudeCodeSession({ filePath, uploader });
};

export { parseSession };
