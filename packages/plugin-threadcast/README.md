# ThreadCast Agent Plugins

This package contains ThreadCast plugins for Claude Code and Codex. Both plugins use the same bundled MCP server.

## Claude Code

Claude Code commands:

- `/threadcast:login`
- `/threadcast:logout`
- `/threadcast:status`
- `/threadcast:share`
- `/threadcast:share-recent`

Run Claude Code with the Claude plugin root:

```bash
THREADCAST_API_URL=http://localhost:5173 \
THREADCAST_CONFIG_DIR=$HOME/.threadcast-dev \
claude --plugin-dir ./packages/plugin-threadcast/claude
```

## Codex

Codex installs from the repo marketplace entry in `.agents/plugins/marketplace.json`, which points at:

```bash
./packages/plugin-threadcast/codex
```

The Codex plugin includes command-like skills and the local ThreadCast MCP server:

- `$threadcast:threadcast-login`
- `$threadcast:threadcast-logout`
- `$threadcast:threadcast-status`
- `$threadcast:threadcast-share`
- `$threadcast:threadcast-share-recent`

## Development

Build the bundled MCP servers:

```bash
bun run --filter @threadcast/plugin-threadcast build
```

For full local e2e testing, see `../../kb/local-dev.md`.
