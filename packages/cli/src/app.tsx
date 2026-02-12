import { Show } from "solid-js";
import { AppProvider, useApp } from "./context/app-context.js";
import { SessionsView } from "./views/sessions-view.js";
import { PreviewView } from "./views/preview-view.js";
import { LoginView } from "./views/login-view.js";
import { StatusBar } from "./components/status-bar.js";

const AppContent = () => {
  const [state] = useApp();

  return (
    <box flexDirection="column" width="100%" height="100%">
      <SessionsView visible={state.view === "sessions"} />
      <Show when={state.view === "preview"}>
        <PreviewView />
      </Show>
      <Show when={state.view === "login"}>
        <LoginView />
      </Show>
      <StatusBar />
    </box>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export { App };
