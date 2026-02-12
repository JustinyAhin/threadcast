import { createContext, useContext, type ParentProps } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { AppState, SearchResult } from "../types.js";
import type { AuthConfig, SessionSummary, ThreadData } from "@threadcast/shared";
import { loadConfig, saveConfig, clearConfig } from "../auth/config.js";
import { githubDeviceFlow } from "../auth/github-device-flow.js";
import { discoverSessions, findSession } from "../lib/session-discovery.js";
import { parseSession } from "../parser/index.js";
import { uploadThread } from "../uploader/api-client.js";
import { searchSessions } from "../lib/session-search.js";

type AppActions = {
  loadSessions: () => Promise<void>;
  selectSession: (index: number) => void;
  openPreview: () => Promise<void>;
  goBack: () => void;
  setFilter: (text: string) => void;
  startSearch: () => Promise<void>;
  cancelSearch: () => void;
  startLogin: () => Promise<void>;
  cancelLogin: () => void;
  startUpload: () => Promise<void>;
  logout: () => Promise<void>;
  displayedSessions: () => SearchResult[];
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
  searchMode: "filter",
  searchResults: [],
  searching: false,
  searchProgress: "",
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

  let searchAbort: AbortController | null = null;

  const filteredSessions = (): SearchResult[] => {
    if (!state.filterText) return state.sessions;
    const lower = state.filterText.toLowerCase();
    return state.sessions.filter(
      (s) =>
        s.firstMessage.toLowerCase().includes(lower) ||
        s.projectPath.toLowerCase().includes(lower)
    );
  };

  const displayedSessions = (): SearchResult[] => {
    if (state.searchMode === "search") {
      // Merge: shallow matches first, then deep-only matches
      const shallow = filteredSessions();
      const shallowIds = new Set(shallow.map((s) => s.sessionId));
      const deepOnly = state.searchResults.filter(
        (s) => !shallowIds.has(s.sessionId)
      );
      return [...shallow, ...deepOnly];
    }
    return filteredSessions();
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
      const max = displayedSessions().length - 1;
      setState("selectedIndex", Math.max(0, Math.min(index, max)));
    },

    openPreview: async () => {
      const session = displayedSessions()[state.selectedIndex];
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
          // Reset deep search when filter text changes
          if (s.searchMode === "search") {
            s.searchMode = "filter";
            s.searchResults = [];
            s.searching = false;
            s.searchProgress = "";
          }
        })
      );
      if (searchAbort) {
        searchAbort.abort();
        searchAbort = null;
      }
    },

    startSearch: async () => {
      if (!state.filterText) return;

      // Cancel any existing search
      if (searchAbort) {
        searchAbort.abort();
      }
      searchAbort = new AbortController();

      setState(
        produce((s) => {
          s.searchMode = "search";
          s.searchResults = [];
          s.searching = true;
          s.searchProgress = `0/${s.sessions.length} sessions`;
          s.selectedIndex = 0;
        })
      );

      try {
        await searchSessions({
          query: state.filterText,
          sessions: state.sessions,
          callbacks: {
            onMatch: (session, snippet) => {
              setState(
                produce((s) => {
                  s.searchResults = [...s.searchResults, { ...session, matchSnippet: snippet }];
                })
              );
            },
            onProgress: (scanned, total) => {
              setState("searchProgress", `${scanned}/${total} sessions`);
            },
            signal: searchAbort!.signal,
          },
        });
      } catch {
        // Aborted or error
      } finally {
        setState("searching", false);
        searchAbort = null;
      }
    },

    cancelSearch: () => {
      if (searchAbort) {
        searchAbort.abort();
        searchAbort = null;
      }
      setState(
        produce((s) => {
          s.searchMode = "filter";
          s.searchResults = [];
          s.searching = false;
          s.searchProgress = "";
          s.filterText = "";
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
        // Redirect to login first, then resume upload
        await actions.startLogin();
        if (!state.auth) return; // login failed or cancelled
        setState("view", "preview");
      }

      if (!state.previewData) return;

      // Update uploader info in case it was parsed before login
      setState(
        produce((s) => {
          if (s.previewData && s.auth) {
            s.previewData.uploader = {
              githubUsername: s.auth.githubUsername,
              githubAvatarUrl: s.auth.githubAvatarUrl,
            };
          }
        })
      );

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

    displayedSessions,
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
