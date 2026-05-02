---
name: threadcast-share-recent
description: List recent local Claude Code or Codex sessions, ask the user to choose one, then share it to ThreadCast.
---

# ThreadCast Share Recent

Use ThreadCast MCP tools. Do not use shell commands.

1. Call `threadcast.status`.
2. If the user is not authenticated or login is pending, call `threadcast.login`.
3. If login returns a pending browser or device flow, show the verification URL and user code, then stop.
4. Call `threadcast.list_recent_sessions` with `limit: 10` and a `source` filter only when the user named Claude Code or Codex.
5. Show the sessions with source, session ID, title, and project path.
6. Ask which session to share unless the user already chose one.
7. Call `threadcast.share_session` with the chosen `sessionId` and `source`.
8. Reply with the share URL and title only after the tool succeeds.
