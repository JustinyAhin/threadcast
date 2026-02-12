import { useApp } from "../context/app-context.js";

const StatusBar = () => {
  const [state] = useApp();

  const authLabel = () =>
    state.auth ? `@${state.auth.githubUsername}` : "not logged in";

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

  const hints = () => {
    switch (state.view) {
      case "sessions":
        if (state.searchMode === "search") {
          return "j/k:nav  Enter:open  Esc:clear  /:filter  q:quit";
        }
        return "j/k:nav  Enter:open  /:filter  l:login  q:quit";
      case "preview":
        return "s:share  Esc:back  q:quit";
      case "login":
        return "Esc:cancel  q:quit";
    }
  };

  return (
    <box
      flexDirection="row"
      width="100%"
      height={1}
      backgroundColor="#1A1A2E"
      paddingX={1}
    >
      <text
        content={`${authLabel()}${uploadLabel()}${searchLabel()}`}
        fg="#888888"
        flexGrow={1}
      />
      <text content={hints()} fg="#555555" />
    </box>
  );
};

export { StatusBar };
