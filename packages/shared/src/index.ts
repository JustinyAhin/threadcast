import { z } from "zod";

// ── Tool Call ────────────────────────────────────────────────────────────────

const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.any()),
  result: z
    .object({
      content: z.string(),
      isError: z.boolean(),
    })
    .optional(),
});

type ToolCall = z.infer<typeof ToolCallSchema>;

// ── Content Block ────────────────────────────────────────────────────────────

const TextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ToolCallBlockSchema = z.object({
  type: z.literal("tool_call"),
  tool: ToolCallSchema,
});

const ContentBlockSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  ToolCallBlockSchema,
]);

type ContentBlock = z.infer<typeof ContentBlockSchema>;

// ── Processed Turn ───────────────────────────────────────────────────────────

const ProcessedTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  timestamp: z.string().datetime(),
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

type ProcessedTurn = z.infer<typeof ProcessedTurnSchema>;

// ── Thread Metadata ──────────────────────────────────────────────────────────

const ThreadMetadataSchema = z.object({
  sessionId: z.string(),
  title: z.string(),
  projectName: z.string(),
  gitBranch: z.string().optional(),
  created: z.string().datetime(),
  duration: z.string(),
  totalTokens: z.object({
    input: z.number(),
    output: z.number(),
  }),
  models: z.array(z.string()),
  toolsUsed: z.array(z.string()),
  messageCount: z.number(),
  visibility: z.enum(["public", "private"]).default("private"),
});

type ThreadMetadata = z.infer<typeof ThreadMetadataSchema>;

// ── Uploader ─────────────────────────────────────────────────────────────────

const UploaderSchema = z.object({
  githubUsername: z.string(),
  githubAvatarUrl: z.url(),
});

type Uploader = z.infer<typeof UploaderSchema>;

// ── Thread Data (core contract) ──────────────────────────────────────────────

const ThreadDataSchema = z.object({
  version: z.literal(1),
  metadata: ThreadMetadataSchema,
  uploader: UploaderSchema,
  turns: z.array(ProcessedTurnSchema),
});

type ThreadData = z.infer<typeof ThreadDataSchema>;

// ── Raw JSONL line types (what Claude Code writes) ───────────────────────────

type RawJsonlLine = {
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
};

type RawMessage = {
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
};

type RawContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, any> }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string | RawContentBlock[];
    };

// ── Session Summary (for `threadcast list`) ──────────────────────────────────

type SessionSummary = {
  sessionId: string;
  path: string;
  projectPath: string;
  firstMessage: string;
  messageCount: number;
  created: string;
  lastModified: string;
  sizeBytes: number;
};

// ── API Types ────────────────────────────────────────────────────────────────

type UploadResponse = {
  id: string;
  url: string;
};

type ApiError = {
  error: string;
  message: string;
};

// ── Config ───────────────────────────────────────────────────────────────────

type AuthConfig = {
  githubToken: string;
  githubUsername: string;
  githubAvatarUrl: string;
};

const API_BASE_URL = "http://localhost:5173";
const GITHUB_CLIENT_ID = "Ov23lia5xNvzQnuRLieM";
const MAX_THREAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export {
  ToolCallSchema,
  TextBlockSchema,
  ToolCallBlockSchema,
  ContentBlockSchema,
  ProcessedTurnSchema,
  ThreadMetadataSchema,
  UploaderSchema,
  ThreadDataSchema,
  API_BASE_URL,
  GITHUB_CLIENT_ID,
  MAX_THREAD_SIZE_BYTES,
  type ToolCall,
  type ContentBlock,
  type ProcessedTurn,
  type ThreadMetadata,
  type Uploader,
  type ThreadData,
  type RawJsonlLine,
  type RawMessage,
  type RawContentBlock,
  type SessionSummary,
  type UploadResponse,
  type ApiError,
  type AuthConfig,
};

export { calculateThreadCost, formatCost, MODEL_PRICING, type ModelPricing } from "./pricing";
