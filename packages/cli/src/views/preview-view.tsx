import { Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useApp } from "../context/app-context.js";

const PreviewView = () => {
  const [state, actions] = useApp();

  useKeyboard((key) => {
    if (state.view !== "preview") return;

    if (key.name === "escape") {
      actions.goBack();
    } else if (key.name === "s") {
      if (state.uploadStatus !== "uploading") {
        actions.startUpload();
      }
    } else if (key.name === "q") {
      process.exit(0);
    } else if (key.ctrl && key.name === "c") {
      process.exit(0);
    }
  });

  const meta = () => state.previewData?.metadata;

  return (
    <box flexDirection="column" width="100%" flexGrow={1} paddingX={1}>
      <box height={1}>
        <text fg="#00BFFF"><b>Preview</b></text>
      </box>

      <Show when={state.previewLoading}>
        <text content="Parsing session..." fg="#888888" />
      </Show>

      <Show when={state.uploadError && !state.previewData}>
        <text content={state.uploadError!} fg="#FF4444" />
      </Show>

      <Show when={meta()}>
        <box flexDirection="column" gap={0}>
          <box flexDirection="row">
            <text fg="#888888"><b>{"Title:    "}</b></text>
            <text content={meta()!.title} fg="#FFFFFF" />
          </box>
          <box flexDirection="row">
            <text fg="#888888"><b>{"Project:  "}</b></text>
            <text content={meta()!.projectName} fg="#FFFFFF" />
          </box>
          <box flexDirection="row">
            <text fg="#888888"><b>{"Duration: "}</b></text>
            <text content={meta()!.duration} fg="#FFFFFF" />
          </box>
          <box flexDirection="row">
            <text fg="#888888"><b>{"Tokens:   "}</b></text>
            <text
              content={`${meta()!.totalTokens.input.toLocaleString()} in / ${meta()!.totalTokens.output.toLocaleString()} out`}
              fg="#FFFFFF"
            />
          </box>
          <box flexDirection="row">
            <text fg="#888888"><b>{"Models:   "}</b></text>
            <text content={meta()!.models.join(", ")} fg="#FFFFFF" />
          </box>
          <box flexDirection="row">
            <text fg="#888888"><b>{"Tools:    "}</b></text>
            <text content={meta()!.toolsUsed.join(", ")} fg="#FFFFFF" />
          </box>
          <box flexDirection="row">
            <text fg="#888888"><b>{"Messages: "}</b></text>
            <text content={String(meta()!.messageCount)} fg="#FFFFFF" />
          </box>
        </box>

        <box height={1} />

        <Show when={state.uploadStatus === "idle"}>
          <text content="Press 's' to share" fg="#FFAA00" />
        </Show>
        <Show when={state.uploadStatus === "uploading"}>
          <text content="Uploading..." fg="#FFAA00" />
        </Show>
        <Show when={state.uploadStatus === "success"}>
          <box flexDirection="column">
            <text fg="#00FF00"><b>Shared!</b></text>
            <text content={state.uploadError ?? ""} fg="#00BFFF" />
          </box>
        </Show>
        <Show when={state.uploadStatus === "error"}>
          <text content={`Error: ${state.uploadError}`} fg="#FF4444" />
        </Show>
      </Show>
    </box>
  );
};

export { PreviewView };
