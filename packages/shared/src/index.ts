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

// ── Uploader ─────────────────────────────────────────────────────────────────

const UploaderSchema = z.object({
  githubUsername: z.string(),
  githubAvatarUrl: z.url(),
});

// ── Thread Data (core contract) ──────────────────────────────────────────────

const ThreadDataSchema = z.object({
  version: z.literal(1),
  metadata: ThreadMetadataSchema,
  uploader: UploaderSchema,
  turns: z.array(ProcessedTurnSchema),
});

const API_BASE_URL = "https://threadcast.dev";
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
};

export type {
  ApiError,
  AuthConfig,
  ContentBlock,
  ModelPricing,
  ProcessedTurn,
  RawContentBlock,
  RawJsonlLine,
  RawMessage,
  SessionSummary,
  ThreadData,
  ThreadMetadata,
  ToolCall,
  UploadResponse,
  Uploader,
} from "./types";

export { calculateThreadCost, formatCost, MODEL_PRICING } from "./pricing";
