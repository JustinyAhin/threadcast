import { For, Show, onMount, createEffect } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import type { ScrollBoxRenderable } from "@opentui/core";
import { useApp } from "../context/app-context.js";
import { SessionItem } from "../components/session-item.js";
import { colors } from "../theme.js";

type SessionsViewProps = {
  visible?: boolean;
};

const SessionsView = (props: SessionsViewProps) => {
  const [state, actions] = useApp();
  let scrollboxRef!: ScrollBoxRenderable;

  onMount(() => {
    if (state.sessions.length === 0) {
      actions.loadSessions();
    }
  });

  createEffect(() => {
    const index = state.selectedIndex;
    if (!scrollboxRef) return;

    const innerBox = scrollboxRef.content.getChildren()[0];
    if (!innerBox) return;

    const items = innerBox.getChildren();
    const selected = items[index];
    if (!selected) return;

    const itemTop = selected.y;
    const itemBottom = itemTop + selected.height;
    const scrollTop = scrollboxRef.scrollTop;
    const viewportHeight = scrollboxRef.viewport.height;

    if (itemBottom > scrollTop + viewportHeight) {
      scrollboxRef.scrollTo(itemBottom - viewportHeight);
    } else if (itemTop < scrollTop) {
      scrollboxRef.scrollTo(itemTop);
    }
  });

  useKeyboard((key) => {
    if (props.visible === false) return;

    if (state.filtering) {
      if (key.name === "escape") {
        actions.setFiltering(false);
        if (state.searchMode === "search") {
          actions.cancelSearch();
        } else {
          actions.setFilter("");
        }
        return;
      }
      if (key.name === "return") {
        actions.setFiltering(false);
        if (state.filterText) {
          actions.startSearch();
        }
        return;
      }
      if (key.name === "backspace") {
        if (key.meta || key.option) {
          const trimmed = state.filterText.trimEnd();
          const lastSpace = trimmed.lastIndexOf(" ");
          actions.setFilter(lastSpace === -1 ? "" : state.filterText.slice(0, lastSpace + 1));
        } else {
          actions.setFilter(state.filterText.slice(0, -1));
        }
        return;
      }
      if (key.ctrl && key.name === "w") {
        const trimmed = state.filterText.trimEnd();
        const lastSpace = trimmed.lastIndexOf(" ");
        actions.setFilter(lastSpace === -1 ? "" : state.filterText.slice(0, lastSpace + 1));
        return;
      }
      if (key.ctrl && key.name === "u") {
        actions.setFilter("");
        return;
      }
      if (key.name === "down") {
        actions.setFiltering(false);
        actions.selectSession(state.selectedIndex + 1);
        return;
      }
      if (key.name === "up") {
        actions.setFiltering(false);
        actions.selectSession(state.selectedIndex - 1);
        return;
      }
      if (key.name === "space" || (key.name.length === 1 && !key.ctrl && !key.meta)) {
        actions.setFilter(state.filterText + (key.name === "space" ? " " : key.name));
        return;
      }
      return;
    }

    // Handle Esc when in search mode but not actively filtering
    if (key.name === "escape" && state.searchMode === "search") {
      actions.cancelSearch();
      return;
    }

    const sessions = actions.displayedSessions();

    if (key.name === "j" || key.name === "down") {
      actions.selectSession(state.selectedIndex + 1);
    } else if (key.name === "k" || key.name === "up") {
      actions.selectSession(state.selectedIndex - 1);
    } else if (key.name === "return") {
      if (sessions.length > 0) {
        actions.openPreview();
      }
    } else if (key.name === "/") {
      actions.setFiltering(true);
    } else if (key.name === "s") {
      actions.shareFromList();
    } else if (key.name === "l") {
      actions.startLogin();
    } else if (key.name === "q") {
      process.exit(0);
    } else if (key.ctrl && key.name === "c") {
      process.exit(0);
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1} visible={props.visible}>
      <box
        flexDirection="column"
        width="100%"
        flexGrow={1}
        borderStyle="rounded"
        borderColor={colors.border}
      >
        <box flexDirection="row" paddingX={1} height={1}>
          <text fg={colors.accent}><b>ThreadCast</b></text>
          <text
            content={` — ${actions.displayedSessions().length} sessions`}
            fg={colors.textDim}
          />
          <Show when={state.filtering}>
            <text content={`  /${state.filterText}_`} fg={colors.warning} />
          </Show>
          <Show when={!state.filtering && state.filterText && state.searchMode === "filter"}>
            <text content={`  filter: ${state.filterText}`} fg={colors.warning} />
          </Show>
          <Show when={!state.filtering && state.searchMode === "search"}>
            <text content={`  search: ${state.filterText}`} fg={colors.search} />
            <Show when={state.searching}>
              <text content={`  (${state.searchProgress})`} fg={colors.textDim} />
            </Show>
            <Show when={!state.searching}>
              <text content={`  (${state.searchResults.length} matches)`} fg={colors.textDim} />
            </Show>
          </Show>
        </box>

        <scrollbox ref={scrollboxRef} scrollY flexGrow={1} width="100%">
          <box flexDirection="column" width="100%">
            <Show when={state.sessionsLoading}>
              <box paddingX={1} paddingY={1}>
                <text content="Scanning sessions..." fg={colors.textDim} />
              </box>
            </Show>

            <Show when={!state.sessionsLoading && actions.displayedSessions().length === 0}>
              <box paddingX={1} paddingY={1}>
                <text content="No sessions found." fg={colors.textFaint} />
              </box>
            </Show>

            <Show when={!state.sessionsLoading && actions.displayedSessions().length > 0}>
              <For each={actions.displayedSessions()}>
                {(session, i) => (
                  <SessionItem
                    session={session}
                    selected={i() === state.selectedIndex}
                    shared={session.sessionId in state.sharedSessions}
                  />
                )}
              </For>
            </Show>
          </box>
        </scrollbox>
      </box>
    </box>
  );
};

export { SessionsView };
