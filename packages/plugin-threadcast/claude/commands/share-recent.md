---
description: Pick a recent Claude Code session and share it to ThreadCast.
---

Help the user share a recent Claude Code session with ThreadCast.

Use ThreadCast MCP tools only. Do not run shell commands. Do not use any `threadcast` CLI from `$PATH`. If the `threadcast.*` MCP tools are unavailable, tell the user the ThreadCast plugin MCP server is not loaded and ask them to check `/mcp` and restart Claude Code.

1. Call `threadcast.status`.
2. If the user is not authenticated or has a pending login, call `threadcast.login`.
3. If `threadcast.login` returns a pending fallback device login, show the verification URL and user code and stop.
4. Call `threadcast.list_recent_sessions` with `{ "limit": 10, "source": "claude-code" }`.
5. If the user has not identified a specific session yet, show the list and ask which session ID to share.
6. Once the user chooses a session, call `threadcast.share_session` with `{ "sessionId": "<chosen-session-id>", "source": "claude-code" }`.
7. Reply with the share URL only after the tool succeeds.
