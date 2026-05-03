---
description: Show ThreadCast login state and latest local session.
---

Show the current ThreadCast authentication state and the latest local session available to share.

Use ThreadCast MCP tools only. Do not run shell commands. Do not use any `threadcast` CLI from `$PATH`. If the `threadcast.*` MCP tools are unavailable, tell the user the ThreadCast plugin MCP server is not loaded and ask them to check `/mcp` and restart Claude Code.

Call `threadcast.status` and summarize the result briefly, including whether login is pending because the fallback device flow is active.
