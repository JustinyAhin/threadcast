# ThreadCast Agent Plugins

This package contains the ThreadCast plugins for Claude Code and Codex. Both plugins use the same bundled local MCP server to find, parse, and upload saved sessions.

## Claude Code

Install from the repo marketplace:

```bash
claude plugin marketplace add JustinyAhin/threadcast
claude plugin install threadcast@threadcast
```

Claude Code commands:

- `/threadcast:login`
- `/threadcast:logout`
- `/threadcast:status`
- `/threadcast:share`
- `/threadcast:share-recent`

## Codex

Install from the repo marketplace:

```bash
codex plugin marketplace add JustinyAhin/threadcast
```

Then open Codex, run `/plugins`, and install ThreadCast.

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

For full local e2e testing, see `../../kb/local-dev.md`.
