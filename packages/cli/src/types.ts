import type { AuthConfig, SessionSummary, ThreadData } from "@threadcast/shared";
import type { SharedSessionsMap } from "./lib/shared-sessions.js";
import type { PresetCount } from "./lib/date-filter.js";

type SearchResult = SessionSummary & {
  matchSnippet?: string;
};

type AppState = {
  view: "sessions" | "preview" | "login";
  auth: AuthConfig | null;
  sessions: SessionSummary[];
  sessionsLoading: boolean;
  selectedIndex: number;
  filtering: boolean;
  filterText: string;
  searchMode: "filter" | "search";
  searchResults: SearchResult[];
  searching: boolean;
  searchProgress: string;
  previewData: ThreadData | null;
  previewLoading: boolean;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadError: string | null;
  loginDeviceCode: string | null;
  loginVerificationUri: string | null;
  loginStatus: "idle" | "waiting" | "success" | "error";
  sharedSessions: SharedSessionsMap;
  bulkShareView: boolean;
  bulkSharePresetIndex: number;
  bulkSharePresets: PresetCount[];
  bulkShareProgress: { current: number; total: number; urls: string[] } | null;
};

export type { AppState, SearchResult };
