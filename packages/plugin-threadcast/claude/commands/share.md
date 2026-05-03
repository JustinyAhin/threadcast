---
description: Share the latest Claude Code session to ThreadCast.
---

Share the most recent Claude Code session for the current project using ThreadCast.

Use ThreadCast MCP tools only. Do not run shell commands. Do not use any `threadcast` CLI from `$PATH`. If the `threadcast.*` MCP tools are unavailable, tell the user the ThreadCast plugin MCP server is not loaded and ask them to check `/mcp` and restart Claude Code.

1. Call `threadcast.status`.
2. If the user is not authenticated or has a pending login, call `threadcast.login`.
3. If `threadcast.login` returns a pending fallback device login, show the verification URL and user code and stop.
4. Call `threadcast.share_session` with `{ "source": "claude-code" }`.
5. Reply with the share URL and the shared session title only.
