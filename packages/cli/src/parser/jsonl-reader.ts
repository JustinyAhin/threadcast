import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { RawJsonlLine } from "@threadcast/shared";

/**
 * Stream-reads a JSONL file and yields parsed lines.
 * Skips lines that fail to parse.
 */
export async function* readJsonlFile(
  filePath: string
): AsyncGenerator<RawJsonlLine> {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      yield JSON.parse(trimmed) as RawJsonlLine;
    } catch {
      // Skip malformed lines
    }
  }
}

/**
 * Read all lines from a JSONL file, filtering to only user/assistant messages.
 */
export async function readSessionMessages(
  filePath: string
): Promise<RawJsonlLine[]> {
  const messages: RawJsonlLine[] = [];
  for await (const line of readJsonlFile(filePath)) {
    if (line.type === "user" || line.type === "assistant") {
      if (line.isSidechain || line.isMeta) continue;
      messages.push(line);
    }
  }
  return messages;
}
