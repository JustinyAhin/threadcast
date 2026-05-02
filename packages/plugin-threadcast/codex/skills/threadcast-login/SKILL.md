---
name: threadcast-login
description: Log in to ThreadCast from Codex using the local ThreadCast MCP server.
---

# ThreadCast Login

Use the `threadcast.login` MCP tool. Do not use shell commands.

If the tool reports an existing authenticated user, summarize that result.

If browser login succeeds, tell the user which GitHub account is connected.

If the tool returns a pending browser or device flow, show the verification URL and user code, then tell the user to complete approval and run `$threadcast-login` again.
