import { For } from "solid-js";
import { useApp } from "../context/app-context.js";
import { colors, symbols } from "../theme.js";

type Hint = { key: string; label: string };

const StatusBar = () => {
  const [state] = useApp();

  const authLabel = () =>
    state.auth ? `${symbols.github} @${state.auth.githubUsername}` : `${symbols.github} not logged in`;

  const uploadLabel = () => {
    switch (state.uploadStatus) {
      case "uploading":
        return " | uploading...";
      case "success":
        return ` | shared: ${state.uploadError}`;
      case "error":
        return ` | error: ${state.uploadError}`;
      default:
        return "";
    }
  };

  const searchLabel = () => {
    if (!state.searching) return "";
    return ` | searching: ${state.searchProgress}`;
  };

  const hints = (): Hint[] => {
    switch (state.view) {
      case "sessions":
        if (state.filtering) {
          return [
            { key: "Enter", label: "search" },
            { key: "Opt+\u232B", label: "del word" },
            { key: "Ctrl+U", label: "clear" },
            { key: "Esc", label: "cancel" },
          ];
        }
        if (state.searchMode === "search") {
          return [
            { key: "j/k", label: "nav" },
            { key: "Enter", label: "open" },
            { key: "s", label: "share" },
            { key: "Esc", label: "clear" },
            { key: "/", label: "filter" },
            { key: "q", label: "quit" },
          ];
        }
        return [
          { key: "j/k", label: "nav" },
          { key: "Enter", label: "open" },
          { key: "s", label: "share" },
          { key: "r", label: "refresh" },
          { key: "/", label: "filter" },
          { key: "l", label: "login" },
          { key: "q", label: "quit" },
        ];
      case "preview":
        return [
          { key: "s", label: "share" },
          { key: "Esc", label: "back" },
          { key: "q", label: "quit" },
        ];
      case "login":
        return [
          { key: "Esc", label: "cancel" },
          { key: "q", label: "quit" },
        ];
    }
  };

  return (
    <box
      flexDirection="row"
      width="100%"
      height={1}
      backgroundColor={colors.bgStatusBar}
      paddingX={1}
    >
      <text
        content={`${authLabel()}${uploadLabel()}${searchLabel()}`}
        fg={colors.textDim}
        flexGrow={1}
      />
      <box flexDirection="row">
        <For each={hints()}>
          {(hint, i) => (
            <box flexDirection="row">
              <text fg={colors.textMuted}><b>{hint.key}</b></text>
              <text content={`:${hint.label}`} fg={colors.textFaint} />
              <text content={i() < hints().length - 1 ? "  " : ""} />
            </box>
          )}
        </For>
      </box>
    </box>
  );
};

export { StatusBar };
