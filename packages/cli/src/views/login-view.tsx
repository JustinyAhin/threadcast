import { Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useApp } from "../context/app-context.js";

const LoginView = () => {
  const [state, actions] = useApp();

  useKeyboard((key) => {
    if (state.view !== "login") return;

    if (key.name === "escape") {
      actions.cancelLogin();
    } else if (key.name === "q") {
      process.exit(0);
    } else if (key.ctrl && key.name === "c") {
      process.exit(0);
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1} paddingX={1}>
      <box height={1}>
        <text fg="#00BFFF"><b>GitHub Login</b></text>
      </box>

      <Show when={state.loginStatus === "idle"}>
        <text content="Requesting device code..." fg="#888888" />
      </Show>

      <Show when={state.loginStatus === "waiting"}>
        <box flexDirection="column" gap={0}>
          <box height={1} />
          <box flexDirection="row">
            <text content="Enter code: " fg="#888888" />
            <text fg="#00BFFF"><b>{state.loginDeviceCode ?? ""}</b></text>
          </box>
          <box height={1} />
          <box flexDirection="row">
            <text content="Open: " fg="#888888" />
            <text content={state.loginVerificationUri ?? ""} fg="#FFFFFF" />
          </box>
          <box height={1} />
          <text content="(Browser should open automatically)" fg="#555555" />
          <box height={1} />
          <text content="Waiting for authorization..." fg="#FFAA00" />
        </box>
      </Show>

      <Show when={state.loginStatus === "success"}>
        <box flexDirection="column">
          <text fg="#00FF00"><b>{`Logged in as ${state.auth?.githubUsername}`}</b></text>
          <text content="Returning to sessions..." fg="#888888" />
        </box>
      </Show>

      <Show when={state.loginStatus === "error"}>
        <box flexDirection="column">
          <text fg="#FF4444"><b>Login failed</b></text>
          <text content="Press Esc to go back" fg="#888888" />
        </box>
      </Show>
    </box>
  );
};

export { LoginView };
