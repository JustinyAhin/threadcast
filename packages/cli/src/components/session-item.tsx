import type { SearchResult } from "../types.js";
import { timeAgo, formatBytes } from "../lib/format.js";

type SessionItemProps = {
  session: SearchResult;
  selected: boolean;
};

const SessionItem = (props: SessionItemProps) => {
  const date = () => new Date(props.session.lastModified);
  const project = () => props.session.projectPath.split("/").pop() || "?";
  const preview = () => {
    const msg = props.session.firstMessage;
    return msg.length > 60 ? msg.slice(0, 60) + "..." : msg;
  };

  const snippet = () => props.session.matchSnippet;

  return (
    <box
      flexDirection="column"
      width="100%"
      paddingX={1}
      backgroundColor={props.selected ? "#333333" : undefined}
    >
      <box flexDirection="row" width="100%">
        <text
          content={props.session.sessionId.slice(0, 8)}
          fg="#666666"
          width={10}
        />
        <text
          content={project()}
          fg="#00BFFF"
          width={16}
        />
        <text
          content={preview()}
          fg={props.selected ? "#FFFFFF" : "#CCCCCC"}
          flexGrow={1}
        />
        <text
          content={`${props.session.messageCount} msgs`}
          fg="#666666"
          width={10}
        />
        <text
          content={timeAgo(date())}
          fg="#666666"
          width={10}
        />
        <text
          content={formatBytes(props.session.sizeBytes)}
          fg="#666666"
          width={8}
        />
      </box>
      {snippet() && (
        <box flexDirection="row" width="100%" paddingLeft={10}>
          <text
            content={snippet()!}
            fg="#888888"
            flexGrow={1}
          />
        </box>
      )}
    </box>
  );
};

export { SessionItem };
