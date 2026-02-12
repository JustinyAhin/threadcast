import type { AuthConfig, SessionSummary, ThreadData } from "@threadcast/shared";

type AppState = {
  view: "sessions" | "preview" | "login";
  auth: AuthConfig | null;
  sessions: SessionSummary[];
  sessionsLoading: boolean;
  selectedIndex: number;
  filterText: string;
  previewData: ThreadData | null;
  previewLoading: boolean;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  uploadError: string | null;
  loginDeviceCode: string | null;
  loginVerificationUri: string | null;
  loginStatus: "idle" | "waiting" | "success" | "error";
};

export type { AppState };
