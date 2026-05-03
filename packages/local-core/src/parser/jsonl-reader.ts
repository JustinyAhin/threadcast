import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { RawJsonlLine } from "@threadcast/shared";

const readJsonlFile = async function* (
  filePath: string,
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
};

const readSessionMessages = async (
  filePath: string,
): Promise<RawJsonlLine[]> => {
  const messages: RawJsonlLine[] = [];
  for await (const line of readJsonlFile(filePath)) {
    if (line.type === "user" || line.type === "assistant") {
      if (line.isSidechain || line.isMeta) continue;
      messages.push(line);
    }
  }
  return messages;
};

export { readSessionMessages };
