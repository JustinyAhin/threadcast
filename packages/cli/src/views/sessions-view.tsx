import { For, Show, createSignal, onMount } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useApp } from "../context/app-context.js";
import { SessionItem } from "../components/session-item.js";

const SessionsView = () => {
  const [state, actions] = useApp();
  const [filtering, setFiltering] = createSignal(false);

  onMount(() => {
    actions.loadSessions();
  });

  useKeyboard((key) => {
    if (state.view !== "sessions") return;

    if (filtering()) {
      if (key.name === "escape") {
        setFiltering(false);
        actions.setFilter("");
        return;
      }
      if (key.name === "return") {
        setFiltering(false);
        return;
      }
      if (key.name === "backspace") {
        actions.setFilter(state.filterText.slice(0, -1));
        return;
      }
      if (key.name.length === 1 && !key.ctrl && !key.meta) {
        actions.setFilter(state.filterText + key.name);
        return;
      }
      return;
    }

    const sessions = actions.filteredSessions();

    if (key.name === "j" || key.name === "down") {
      actions.selectSession(state.selectedIndex + 1);
    } else if (key.name === "k" || key.name === "up") {
      actions.selectSession(state.selectedIndex - 1);
    } else if (key.name === "return") {
      if (sessions.length > 0) {
        actions.openPreview();
      }
    } else if (key.name === "/") {
      setFiltering(true);
    } else if (key.name === "l") {
      actions.startLogin();
    } else if (key.name === "q") {
      process.exit(0);
    } else if (key.ctrl && key.name === "c") {
      process.exit(0);
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      <box flexDirection="row" paddingX={1} height={1}>
        <text fg="#00BFFF"><b>ThreadCast</b></text>
        <text
          content={` — ${actions.filteredSessions().length} sessions`}
          fg="#888888"
        />
        <Show when={filtering()}>
          <text content={`  /${state.filterText}_`} fg="#FFAA00" />
        </Show>
        <Show when={!filtering() && state.filterText}>
          <text content={`  filter: ${state.filterText}`} fg="#FFAA00" />
        </Show>
      </box>

      <box flexDirection="column" width="100%" flexGrow={1}>
        <Show when={state.sessionsLoading}>
          <box paddingX={1}>
            <text content="Scanning sessions..." fg="#888888" />
          </box>
        </Show>

        <Show when={!state.sessionsLoading && actions.filteredSessions().length === 0}>
          <box paddingX={1}>
            <text content="No sessions found." fg="#666666" />
          </box>
        </Show>

        <Show when={!state.sessionsLoading && actions.filteredSessions().length > 0}>
          <For each={actions.filteredSessions().slice(0, 30)}>
            {(session, i) => (
              <SessionItem
                session={session}
                selected={i() === state.selectedIndex}
              />
            )}
          </For>
        </Show>
      </box>
    </box>
  );
};

export { SessionsView };
