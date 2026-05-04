---
description: Print a ThreadCast diagnostic dump for support and bug reports.
---

Print a diagnostic dump of the ThreadCast plugin and local MCP server so the user can share it in a bug report.

Use ThreadCast MCP tools only. Do not run shell commands. Do not use any `threadcast` CLI from `$PATH`. If the `threadcast.*` MCP tools are unavailable, tell the user the ThreadCast plugin MCP server is not loaded and ask them to check `/mcp` and restart Claude Code.

1. Call `threadcast.debug` (no arguments needed).
2. Print the returned text dump verbatim inside a fenced code block so the user can copy and paste it.
3. Tell the user the dump is safe to share publicly — it contains presence-only env flags, file names, durations, and recent log lines, but no auth tokens or session contents.
