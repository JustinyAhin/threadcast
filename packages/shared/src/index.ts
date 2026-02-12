import { z } from "zod";

// ── Tool Call ────────────────────────────────────────────────────────────────

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  input: z.record(z.any()),
  result: z
    .object({
      content: z.string(),
      isError: z.boolean(),
    })
    .optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

// ── Content Block ────────────────────────────────────────────────────────────

export const TextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const ToolCallBlockSchema = z.object({
  type: z.literal("tool_call"),
  tool: ToolCallSchema,
});

export const ContentBlockSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  ToolCallBlockSchema,
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// ── Processed Turn ───────────────────────────────────────────────────────────

export const ProcessedTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  timestamp: z.string(),
  content: z.array(ContentBlockSchema),
  metadata: z
    .object({
      model: z.string().optional(),
      usage: z
        .object({
          input_tokens: z.number(),
          output_tokens: z.number(),
        })
        .optional(),
    })
    .optional(),
});

export type ProcessedTurn = z.infer<typeof ProcessedTurnSchema>;

// ── Thread Metadata ──────────────────────────────────────────────────────────

export const ThreadMetadataSchema = z.object({
  sessionId: z.string(),
  title: z.string(),
  projectName: z.string(),
  gitBranch: z.string().optional(),
  created: z.string(),
  duration: z.string(),
  totalTokens: z.object({
    input: z.number(),
    output: z.number(),
  }),
  models: z.array(z.string()),
  toolsUsed: z.array(z.string()),
  messageCount: z.number(),
});

export type ThreadMetadata = z.infer<typeof ThreadMetadataSchema>;

// ── Uploader ─────────────────────────────────────────────────────────────────

export const UploaderSchema = z.object({
  githubUsername: z.string(),
  githubAvatarUrl: z.string(),
});

export type Uploader = z.infer<typeof UploaderSchema>;

// ── Thread Data (core contract) ──────────────────────────────────────────────

export const ThreadDataSchema = z.object({
  version: z.literal(1),
  metadata: ThreadMetadataSchema,
  uploader: UploaderSchema,
  turns: z.array(ProcessedTurnSchema),
});

export type ThreadData = z.infer<typeof ThreadDataSchema>;

// ── Raw JSONL line types (what Claude Code writes) ───────────────────────────

export interface RawJsonlLine {
  type: "user" | "assistant" | "file-history-snapshot" | "progress";
  uuid: string;
  parentUuid?: string;
  sessionId: string;
  timestamp: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  cwd?: string;
  gitBranch?: string;
  slug?: string;
  version?: string;
  userType?: string;

  // user/assistant messages
  message?: RawMessage;

  // tool result messages (user type with tool results)
  toolUseResult?: {
    type: string;
    file?: { filePath: string; content: string };
    [key: string]: any;
  };
  sourceToolAssistantUUID?: string;

  // progress messages
  data?: any;
  toolUseID?: string;
  parentToolUseID?: string;

  // user-specific
  permissionMode?: string;
  thinkingMetadata?: any;
  todos?: any;

  // assistant-specific
  requestId?: string;

  // file-history-snapshot
  snapshot?: any;
  isSnapshotUpdate?: boolean;
  messageId?: string;
}

export interface RawMessage {
  role: "user" | "assistant";
  model?: string;
  id?: string;
  type?: string;
  content: string | RawContentBlock[];
  stop_reason?: string | null;
  stop_sequence?: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    [key: string]: any;
  };
}

export type RawContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, any> }
  | { type: "tool_result"; tool_use_id: string; content: string | RawContentBlock[] };

// ── Session Summary (for `threadcast list`) ──────────────────────────────────

export interface SessionSummary {
  sessionId: string;
  path: string;
  projectPath: string;
  firstMessage: string;
  messageCount: number;
  created: string;
  lastModified: string;
  sizeBytes: number;
}

// ── API Types ────────────────────────────────────────────────────────────────

export interface UploadResponse {
  id: string;
  url: string;
}

export interface ApiError {
  error: string;
  message: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

export interface AuthConfig {
  githubToken: string;
  githubUsername: string;
  githubAvatarUrl: string;
}

export const API_BASE_URL = "https://threadcast.dev";
export const GITHUB_CLIENT_ID = "PLACEHOLDER_CLIENT_ID";
export const MAX_THREAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
