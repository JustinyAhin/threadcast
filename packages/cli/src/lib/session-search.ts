import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { SessionSummary } from "@threadcast/shared";

type SearchCallbacks = {
  onMatch: (session: SessionSummary, snippet: string) => void;
  onProgress: (scanned: number, total: number) => void;
  signal: AbortSignal;
};

const extractText = (line: string): string | null => {
  try {
    const data = JSON.parse(line.trim());

    if (data.isSidechain || data.isMeta) return null;
    if (data.type !== "user" && data.type !== "assistant") return null;

    // Tool result content
    if (data.toolUseResult) {
      const result = data.toolUseResult;
      if (result.file?.content) return result.file.content;
      if (typeof result.content === "string") return result.content;
      return null;
    }

    const message = data.message;
    if (!message) return null;

    const content = message.content;
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
      const texts: string[] = [];
      for (const block of content) {
        if (block.type === "text" && block.text) {
          texts.push(block.text);
        } else if (block.type === "tool_result") {
          if (typeof block.content === "string") {
            texts.push(block.content);
          } else if (Array.isArray(block.content)) {
            for (const sub of block.content) {
              if (sub.type === "text" && sub.text) texts.push(sub.text);
            }
          }
        }
      }
      if (texts.length > 0) return texts.join("\n");
    }

    return null;
  } catch {
    return null;
  }
};

const buildSnippet = (text: string, query: string): string => {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return "";

  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 30);

  let snippet = text.slice(start, end).replace(/\n/g, " ");
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
};

const searchSessions = async (opts: {
  query: string;
  sessions: SessionSummary[];
  callbacks: SearchCallbacks;
}): Promise<void> => {
  const { query, sessions, callbacks } = opts;
  const { onMatch, onProgress, signal } = callbacks;
  const lowerQuery = query.toLowerCase();

  for (let i = 0; i < sessions.length; i++) {
    if (signal.aborted) return;

    const session = sessions[i];
    let matched = false;

    const stream = createReadStream(session.path, { encoding: "utf-8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    const cleanup = () => {
      rl.close();
      stream.destroy();
    };

    const abortHandler = () => cleanup();
    signal.addEventListener("abort", abortHandler, { once: true });

    try {
      for await (const line of rl) {
        if (signal.aborted) break;

        const text = extractText(line);
        if (!text) continue;

        if (text.toLowerCase().includes(lowerQuery)) {
          const snippet = buildSnippet(text, query);
          onMatch(session, snippet);
          matched = true;
          break;
        }
      }
    } catch {
      // File read error, skip
    } finally {
      signal.removeEventListener("abort", abortHandler);
      if (!matched) cleanup();
    }

    onProgress(i + 1, sessions.length);
  }
};

export { searchSessions };
