import { Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useApp } from "../context/app-context.js";
import { colors, symbols } from "../theme.js";

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
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      justifyContent="center"
      alignItems="center"
    >
      <box
        flexDirection="column"
        borderStyle="rounded"
        borderColor={colors.border}
        maxWidth={50}
        width="90%"
        paddingX={3}
        paddingY={1}
      >
        <box justifyContent="center">
          <text fg={colors.accent}><b>{`${symbols.github} GitHub Login`}</b></text>
        </box>

        <Show when={state.loginStatus === "idle"}>
          <box height={1} />
          <text content={`${symbols.dot} Requesting device code...`} fg={colors.textDim} />
        </Show>

        <Show when={state.loginStatus === "waiting"}>
          <box height={1} />
          <box flexDirection="column" gap={1}>
            <box flexDirection="row">
              <text content="Enter code: " fg={colors.textDim} />
              <text fg={colors.accent}><b>{state.loginDeviceCode ?? ""}</b></text>
            </box>
            <box flexDirection="row">
              <text content="Open: " fg={colors.textDim} />
              <text content={state.loginVerificationUri ?? ""} fg={colors.text} />
            </box>
            <text content="(Browser should open automatically)" fg={colors.textFaint} />
            <text content={`${symbols.dot} Waiting for authorization...`} fg={colors.warning} />
          </box>
        </Show>

        <Show when={state.loginStatus === "success"}>
          <box height={1} />
          <box flexDirection="column">
            <text fg={colors.success}><b>{`${symbols.check} Logged in as ${state.auth?.githubUsername}`}</b></text>
            <text content="Returning to sessions..." fg={colors.textDim} />
          </box>
        </Show>

        <Show when={state.loginStatus === "error"}>
          <box height={1} />
          <box flexDirection="column">
            <text fg={colors.error}><b>{`${symbols.cross} Login failed`}</b></text>
            <text content="Press Esc to go back" fg={colors.textDim} />
          </box>
        </Show>
      </box>
    </box>
  );
};

export { LoginView };
