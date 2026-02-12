import { Switch, Match } from "solid-js";
import { AppProvider, useApp } from "./context/app-context.js";
import { SessionsView } from "./views/sessions-view.js";
import { PreviewView } from "./views/preview-view.js";
import { LoginView } from "./views/login-view.js";
import { StatusBar } from "./components/status-bar.js";

const AppContent = () => {
  const [state] = useApp();

  return (
    <box flexDirection="column" width="100%" height="100%">
      <Switch>
        <Match when={state.view === "sessions"}>
          <SessionsView />
        </Match>
        <Match when={state.view === "preview"}>
          <PreviewView />
        </Match>
        <Match when={state.view === "login"}>
          <LoginView />
        </Match>
      </Switch>
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
