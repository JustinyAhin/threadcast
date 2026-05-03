---
description: Clear local ThreadCast credentials.
---

Log out of ThreadCast and clear any pending login state.

Use ThreadCast MCP tools only. Do not run shell commands. Do not use any `threadcast` CLI from `$PATH`. If the `threadcast.*` MCP tools are unavailable, tell the user the ThreadCast plugin MCP server is not loaded and ask them to check `/mcp` and restart Claude Code.

1. Call `threadcast.logout`.
2. Tell the user they have been logged out.
