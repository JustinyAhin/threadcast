---
name: threadcast-share
description: Share the latest or requested local Claude Code or Codex session to ThreadCast.
---

# ThreadCast Share

Use ThreadCast MCP tools. Do not use shell commands.

1. Call `threadcast.status`.
2. If the user is not authenticated or login is pending, call `threadcast.login`.
3. If login returns a pending browser or device flow, show the verification URL and user code, then stop.
4. If the user named a source, pass `source` as `claude-code` or `codex`.
5. If the user named a session ID, call `threadcast.share_session` with `sessionId` and `source` when available.
6. Otherwise call `threadcast.share_session` with `source` only when the user named one.
7. Reply with the share URL and title only after the tool succeeds.
