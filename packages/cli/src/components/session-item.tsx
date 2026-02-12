import { Show } from "solid-js";
import type { SearchResult } from "../types.js";
import type { SharedSessionsMap } from "../lib/shared-sessions.js";
import { timeAgo, formatBytes } from "../lib/format.js";
import { colors, symbols } from "../theme.js";

type SessionItemProps = {
  session: SearchResult;
  selected: boolean;
  shared: boolean;
};

const SessionItem = (props: SessionItemProps) => {
  const date = () => new Date(props.session.lastModified);
  const project = () => props.session.projectPath.split("/").pop() || "?";
  const preview = () => {
    const msg = props.session.firstMessage;
    return msg.length > 50 ? msg.slice(0, 50) + symbols.ellipsis : msg;
  };

  const snippet = () => props.session.matchSnippet;

  return (
    <box
      flexDirection="column"
      width="100%"
      paddingX={1}
      backgroundColor={props.selected ? colors.bgSelected : undefined}
    >
      <box flexDirection="row" width="100%">
        <text
          content={props.selected ? symbols.pointer : " "}
          fg={props.selected ? colors.accent : colors.textDim}
          width={3}
        />
        <text
          content={`${symbols.folder} ${project()}`}
          fg={colors.accent}
          width={18}
        />
        <text
          content={preview()}
          fg={props.selected ? colors.text : colors.textMuted}
          flexGrow={1}
        />
        <Show when={props.shared}>
          <text
            content={`${symbols.share} `}
            fg={colors.success}
            width={3}
          />
        </Show>
        <text
          content={`${symbols.clock} ${timeAgo(date())}`}
          fg={colors.textDim}
          width={12}
        />
      </box>
      <box flexDirection="row" width="100%" paddingLeft={3}>
        <text
          content={`${symbols.messages} ${props.session.messageCount} msgs`}
          fg={colors.textFaint}
          width={14}
        />
        <text content={symbols.divider} fg={colors.borderDim} width={3} />
        <text
          content={formatBytes(props.session.sizeBytes)}
          fg={colors.textFaint}
          width={8}
        />
        <text content={symbols.divider} fg={colors.borderDim} width={3} />
        <text
          content={props.session.sessionId.slice(0, 8)}
          fg={colors.textFaint}
        />
      </box>
      <Show when={snippet()}>
        <box flexDirection="row" width="100%" paddingLeft={3}>
          <text
            content={`${symbols.search} ${snippet()!}`}
            fg={colors.textDim}
            flexGrow={1}
          />
        </box>
      </Show>
    </box>
  );
};

export { SessionItem };
