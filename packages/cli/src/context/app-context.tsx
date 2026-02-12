import { createContext, useContext, type ParentProps } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { AppState } from "../types.js";
import type { AuthConfig, SessionSummary, ThreadData } from "@threadcast/shared";
import { loadConfig, saveConfig, clearConfig } from "../auth/config.js";
import { githubDeviceFlow } from "../auth/github-device-flow.js";
import { discoverSessions, findSession } from "../lib/session-discovery.js";
import { parseSession } from "../parser/index.js";
import { uploadThread } from "../uploader/api-client.js";

type AppActions = {
  loadSessions: () => Promise<void>;
  selectSession: (index: number) => void;
  openPreview: () => Promise<void>;
  goBack: () => void;
  setFilter: (text: string) => void;
  startLogin: () => Promise<void>;
  cancelLogin: () => void;
  startUpload: () => Promise<void>;
  logout: () => Promise<void>;
  filteredSessions: () => SessionSummary[];
};

type AppContextValue = [AppState, AppActions];

const AppContext = createContext<AppContextValue>();

const initialState: AppState = {
  view: "sessions",
  auth: null,
  sessions: [],
  sessionsLoading: false,
  selectedIndex: 0,
  filterText: "",
  previewData: null,
  previewLoading: false,
  uploadStatus: "idle",
  uploadError: null,
  loginDeviceCode: null,
  loginVerificationUri: null,
  loginStatus: "idle",
};

const AppProvider = (props: ParentProps) => {
  const [state, setState] = createStore<AppState>({ ...initialState });

  const filteredSessions = () => {
    if (!state.filterText) return state.sessions;
    const lower = state.filterText.toLowerCase();
    return state.sessions.filter(
      (s) =>
        s.firstMessage.toLowerCase().includes(lower) ||
        s.projectPath.toLowerCase().includes(lower)
    );
  };

  const actions: AppActions = {
    loadSessions: async () => {
      setState("sessionsLoading", true);
      try {
        const auth = await loadConfig();
        const sessions = await discoverSessions();
        setState(
          produce((s) => {
            s.auth = auth;
            s.sessions = sessions;
            s.sessionsLoading = false;
            s.selectedIndex = 0;
          })
        );
      } catch {
        setState("sessionsLoading", false);
      }
    },

    selectSession: (index: number) => {
      const max = filteredSessions().length - 1;
      setState("selectedIndex", Math.max(0, Math.min(index, max)));
    },

    openPreview: async () => {
      const session = filteredSessions()[state.selectedIndex];
      if (!session) return;

      setState(
        produce((s) => {
          s.view = "preview";
          s.previewLoading = true;
          s.previewData = null;
          s.uploadStatus = "idle";
          s.uploadError = null;
        })
      );

      try {
        const data = await parseSession(session.path, {
          githubUsername: state.auth?.githubUsername ?? "anonymous",
          githubAvatarUrl: state.auth?.githubAvatarUrl ?? "",
        });
        setState(
          produce((s) => {
            s.previewData = data;
            s.previewLoading = false;
          })
        );
      } catch (err: any) {
        setState(
          produce((s) => {
            s.previewLoading = false;
            s.uploadError = `Parse failed: ${err.message}`;
          })
        );
      }
    },

    goBack: () => {
      setState(
        produce((s) => {
          s.view = "sessions";
          s.previewData = null;
          s.uploadStatus = "idle";
          s.uploadError = null;
        })
      );
    },

    setFilter: (text: string) => {
      setState(
        produce((s) => {
          s.filterText = text;
          s.selectedIndex = 0;
        })
      );
    },

    startLogin: async () => {
      setState(
        produce((s) => {
          s.view = "login";
          s.loginStatus = "idle";
          s.loginDeviceCode = null;
          s.loginVerificationUri = null;
        })
      );

      try {
        const config = await githubDeviceFlow((code, uri) => {
          setState(
            produce((s) => {
              s.loginDeviceCode = code;
              s.loginVerificationUri = uri;
              s.loginStatus = "waiting";
            })
          );
        });

        await saveConfig(config);
        setState(
          produce((s) => {
            s.auth = config;
            s.loginStatus = "success";
          })
        );

        // Auto-navigate back after brief delay
        setTimeout(() => {
          setState("view", "sessions");
        }, 1500);
      } catch (err: any) {
        setState("loginStatus", "error");
      }
    },

    cancelLogin: () => {
      setState(
        produce((s) => {
          s.view = "sessions";
          s.loginStatus = "idle";
        })
      );
    },

    startUpload: async () => {
      if (!state.auth) {
        // Redirect to login first
        await actions.startLogin();
        return;
      }

      if (!state.previewData) return;

      setState(
        produce((s) => {
          s.uploadStatus = "uploading";
          s.uploadError = null;
        })
      );

      try {
        const result = await uploadThread({
          threadData: state.previewData,
          token: state.auth.githubToken,
        });

        setState(
          produce((s) => {
            s.uploadStatus = "success";
            s.uploadError = result.url;
          })
        );
      } catch (err: any) {
        setState(
          produce((s) => {
            s.uploadStatus = "error";
            s.uploadError = err.message;
          })
        );
      }
    },

    logout: async () => {
      await clearConfig();
      setState("auth", null);
    },

    filteredSessions,
  };

  return (
    <AppContext.Provider value={[state, actions]}>
      {props.children}
    </AppContext.Provider>
  );
};

const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export { AppProvider, useApp };
