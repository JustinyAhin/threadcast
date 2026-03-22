# ThreadCast Claude Code Plugin

This plugin adds Claude Code slash commands for sharing local sessions to ThreadCast.

## Commands

- `/threadcast:login`
- `/threadcast:logout`
- `/threadcast:status`
- `/threadcast:share`
- `/threadcast:share-recent`

## Development

Build the bundled MCP server:

```bash
bun run --filter @threadcast/plugin-threadcast build
```

Then run Claude Code with the plugin directory:

```bash
claude --plugin-dir ./packages/plugin-threadcast
```
