import { Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useApp } from "../context/app-context.js";
import { colors, symbols } from "../theme.js";

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
      <Show when={state.previewLoading}>
        <text content="Parsing session..." fg={colors.textDim} />
      </Show>

      <Show when={state.uploadError && !state.previewData}>
        <text content={state.uploadError!} fg={colors.error} />
      </Show>

      <Show when={meta()}>
        <box
          flexDirection="column"
          borderStyle="rounded"
          borderColor={colors.border}
          paddingX={2}
          paddingY={1}
        >
          <box flexDirection="row">
            <text fg={colors.textDim} width={12}><b>{"Title"}</b></text>
            <text content={meta()!.title} fg={colors.text} />
          </box>
          <box flexDirection="row">
            <text fg={colors.textDim} width={12}><b>{"Project"}</b></text>
            <text content={meta()!.projectName} fg={colors.accent} />
          </box>
          <box flexDirection="row">
            <text fg={colors.textDim} width={12}><b>{"Duration"}</b></text>
            <text content={meta()!.duration} fg={colors.text} />
          </box>
          <box flexDirection="row">
            <text fg={colors.textDim} width={12}><b>{"Tokens"}</b></text>
            <text
              content={`${meta()!.totalTokens.input.toLocaleString()} in / ${meta()!.totalTokens.output.toLocaleString()} out`}
              fg={colors.text}
            />
          </box>
          <box flexDirection="row">
            <text fg={colors.textDim} width={12}><b>{"Models"}</b></text>
            <text content={meta()!.models.join(", ")} fg={colors.text} />
          </box>
          <box flexDirection="row">
            <text fg={colors.textDim} width={12}><b>{"Tools"}</b></text>
            <text content={meta()!.toolsUsed.join(", ")} fg={colors.text} />
          </box>
          <box flexDirection="row">
            <text fg={colors.textDim} width={12}><b>{"Messages"}</b></text>
            <text content={String(meta()!.messageCount)} fg={colors.text} />
          </box>
        </box>

        <box height={1} />

        <box paddingX={1}>
          <Show when={state.uploadStatus === "idle"}>
            <text content={`${symbols.share} Press 's' to share`} fg={colors.warning} />
          </Show>
          <Show when={state.uploadStatus === "uploading"}>
            <text content={`${symbols.dot} Uploading...`} fg={colors.warning} />
          </Show>
          <Show when={state.uploadStatus === "success"}>
            <box flexDirection="column">
              <text fg={colors.success}><b>{`${symbols.check} Shared!`}</b></text>
              <text content={state.uploadError ?? ""} fg={colors.accent} />
            </box>
          </Show>
          <Show when={state.uploadStatus === "error"}>
            <text content={`${symbols.cross} Error: ${state.uploadError}`} fg={colors.error} />
          </Show>
        </box>
      </Show>
    </box>
  );
};

export { PreviewView };
