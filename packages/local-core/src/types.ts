import type {
  AuthConfig,
  SessionSource,
  SessionSummary,
} from "@threadcast/shared";

type PendingDeviceLogin = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
  createdAt: string;
};

type PendingLoginAdvanceResult =
  | { status: "pending"; pending: PendingDeviceLogin }
  | { status: "complete"; auth: AuthConfig };

type LocalAuthExchangeResponse = {
  token: string;
  githubId?: string;
  githubUsername: string;
  githubAvatarUrl: string;
  expiresAt: string;
};

type LruCache<T> = {
  get: (key: string) => T | undefined;
  set: (opts: { key: string; value: T }) => void;
  clear: () => void;
};

type CacheEntry = {
  mtimeMs: number;
  size: number;
  firstMessage: string;
  messageCount: number;
};

type SessionCache = {
  get: (filePath: string) => CacheEntry | undefined;
  set: (opts: { filePath: string; entry: CacheEntry }) => void;
  entries: () => IterableIterator<[string, CacheEntry]>;
  clear: () => void;
};

type IndexEntry = {
  sessionId: string;
  source?: SessionSource;
  projectPath: string;
  firstMessage: string;
  messageCount: number;
  created: string;
  lastModified: string;
  sizeBytes: number;
  mtimeMs: number;
};

type SessionIndex = {
  version: 1;
  entries: Record<string, IndexEntry>;
};

type SharedSessionEntry = {
  url: string;
  sharedAt: string;
};

type SharedSessionsMap = Record<string, SharedSessionEntry>;

type DatePreset = {
  label: string;
  days: number;
};

type PresetCount = {
  label: string;
  days: number;
  total: number;
};

type SelectSessionOptions = {
  sessionId?: string;
  source?: SessionSource;
  projectPath?: string;
  cwdProjectPath?: string;
};

type SelectSessionResult = {
  session: SessionSummary | null;
  selector: "sessionId" | "projectPath" | "cwd" | "latest" | "none";
};

type SanitizeOptions = {
  homePath?: string;
  projectPath?: string;
};

type ShareSessionOptions = {
  sessionId?: string;
  source?: SessionSource;
  projectPath?: string;
  cwdProjectPath?: string;
};

type ShareSessionResult = {
  id: string;
  url: string;
  sessionId: string;
  source: SessionSource;
  title: string;
};

export type {
  CacheEntry,
  DatePreset,
  IndexEntry,
  LocalAuthExchangeResponse,
  LruCache,
  PendingDeviceLogin,
  PendingLoginAdvanceResult,
  PresetCount,
  SanitizeOptions,
  SelectSessionOptions,
  SelectSessionResult,
  SessionCache,
  SessionIndex,
  ShareSessionOptions,
  ShareSessionResult,
  SharedSessionEntry,
  SharedSessionsMap,
};
