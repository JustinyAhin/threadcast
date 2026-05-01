import { z } from "zod";

type ToolCall = z.infer<typeof import("./index").ToolCallSchema>;
type ContentBlock = z.infer<typeof import("./index").ContentBlockSchema>;
type ProcessedTurn = z.infer<typeof import("./index").ProcessedTurnSchema>;
type ThreadMetadata = z.infer<typeof import("./index").ThreadMetadataSchema>;
type Uploader = z.infer<typeof import("./index").UploaderSchema>;
type ThreadData = z.infer<typeof import("./index").ThreadDataSchema>;

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
  message?: RawMessage;
  toolUseResult?: {
    type: string;
    file?: { filePath: string; content: string };
    [key: string]: any;
  };
  sourceToolAssistantUUID?: string;
  data?: any;
  toolUseID?: string;
  parentToolUseID?: string;
  permissionMode?: string;
  thinkingMetadata?: any;
  todos?: any;
  requestId?: string;
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

type UploadResponse = {
  id: string;
  url: string;
};

type ApiError = {
  error: string;
  message: string;
};

type AuthConfig = {
  githubToken: string;
  githubUsername: string;
  githubAvatarUrl: string;
};

type ModelPricing = {
  input: number;
  output: number;
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
};
