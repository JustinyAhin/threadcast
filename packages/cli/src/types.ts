import type { AuthConfig, SessionSummary, ThreadData } from "@threadcast/shared";

type SearchResult = SessionSummary & {
  matchSnippet?: string;
};

type AppState = {
  view: "sessions" | "preview" | "login";
  auth: AuthConfig | null;
  sessions: SessionSummary[];
  sessionsLoading: boolean;
  selectedIndex: number;
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
};

export type { AppState, SearchResult };
