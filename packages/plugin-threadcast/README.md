# ThreadCast Agent Plugins

This package contains the ThreadCast plugins for Claude Code and Codex. Both plugins use the same bundled local MCP server to find, parse, and upload saved sessions.

## Claude Code

Install from the repo marketplace using the commands in the root [README](../../README.md#agent-plugins).

Claude Code commands:

- `/threadcast:login`
- `/threadcast:logout`
- `/threadcast:status`
- `/threadcast:share`
- `/threadcast:share-recent`

## Codex

Install from the repo marketplace using the commands in the root [README](../../README.md#agent-plugins).

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

Prepare the plugin files for distribution:

```bash
bun plugin:prepare:dist
```

Bump all plugin versions and prepare distribution files:

```bash
bun plugin:release 0.0.2
```

For full local e2e testing, see `../../kb/local-dev.md`.
