---
description: Authenticate ThreadCast with GitHub.
---

Authenticate ThreadCast with GitHub so local Claude Code sessions can be shared.

Use ThreadCast MCP tools only. Do not run shell commands. Do not use any `threadcast` CLI from `$PATH`. If the `threadcast.*` MCP tools are unavailable, tell the user the ThreadCast plugin MCP server is not loaded and ask them to check `/mcp` and restart Claude Code.

1. Call `threadcast.login`.
2. If the tool returns success, tell the user which GitHub account is now connected.
3. If the tool falls back to device login, show the exact verification URL and user code and tell the user to run `/threadcast:login` again after approving access.
