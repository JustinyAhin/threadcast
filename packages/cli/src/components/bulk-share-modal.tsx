import { For, Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useApp } from "../context/app-context.js";
import { colors, symbols } from "../theme.js";

const BulkShareModal = () => {
  const [state, actions] = useApp();

  useKeyboard((key) => {
    if (!state.bulkShareView) return;

    const progress = state.bulkShareProgress;
    const uploading = progress && progress.current < progress.total;
    if (uploading) return; // no input during upload

    if (key.name === "escape") {
      actions.closeBulkShare();
    } else if (key.name === "j" || key.name === "down") {
      actions.selectBulkSharePreset(state.bulkSharePresetIndex + 1);
    } else if (key.name === "k" || key.name === "up") {
      actions.selectBulkSharePreset(state.bulkSharePresetIndex - 1);
    } else if (key.name === "return") {
      actions.confirmBulkShare();
    } else if (key.name === "q") {
      process.exit(0);
    } else if (key.ctrl && key.name === "c") {
      process.exit(0);
    }
  });

  const presets = () => state.bulkSharePresets;
  const progress = () => state.bulkShareProgress;

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
          <text fg={colors.accent}>
            <b>{`${symbols.share} Bulk Share`}</b>
          </text>
        </box>

        <Show when={!progress()}>
          <box height={1} />
          <text content="Select a time range:" fg={colors.textDim} />
          <box height={1} />

          <For each={presets()}>
            {(preset, i) => {
              const selected = () => i() === state.bulkSharePresetIndex;
              return (
                <box flexDirection="row" height={1}>
                  <text
                    content={selected() ? `${symbols.pointer} ` : "  "}
                    fg={colors.accent}
                  />
                  <text
                    content={preset.label}
                    fg={selected() ? colors.text : colors.textMuted}
                  />
                  <text
                    content={` (${preset.total} sessions)`}
                    fg={colors.textDim}
                  />
                </box>
              );
            }}
          </For>

          <box height={1} />
          <text content="Enter:confirm  Esc:cancel" fg={colors.textFaint} />
        </Show>

        <Show when={progress()}>
          <box height={1} />
          <box flexDirection="column" gap={1}>
            <text
              content={`Sharing ${progress()!.current}/${progress()!.total}...`}
              fg={colors.warning}
            />
            <Show when={progress()!.urls.length > 0}>
              <box flexDirection="column">
                <For each={progress()!.urls.slice(-5)}>
                  {(url) => (
                    <text content={`  ${symbols.check} ${url}`} fg={colors.success} />
                  )}
                </For>
              </box>
            </Show>
            <Show when={progress()!.current === progress()!.total}>
              <box height={1} />
              <text fg={colors.success}>
                <b>{`${symbols.check} Done! ${progress()!.urls.length} session(s) shared.`}</b>
              </text>
              <text content="Press Esc to close" fg={colors.textFaint} />
            </Show>
          </box>
        </Show>
      </box>
    </box>
  );
};

export { BulkShareModal };
