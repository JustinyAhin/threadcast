# Local Development

Use this flow to test ThreadCast locally from the web app, Claude Code, and Codex.

## 1. Start Local Web

Install dependencies once:

```bash
bun install
```

Apply local D1 migrations:

```bash
bun run --filter @threadcast/web db:migrate:local
```

Start the SvelteKit dev server:

```bash
bun dev:web
```

The local app should be available at:

```text
http://localhost:5173
```

Local web env vars live in `.env`. Do not commit or paste secrets.

## 2. Build Plugin Servers

For Codex local testing, switch the active Codex MCP config to localhost:

```bash
bun plugin:codex:local
```

Run this after changing MCP, local-core, or plugin files:

```bash
bun build:plugin
```

This writes bundled MCP servers to:

```text
packages/plugin-threadcast/claude/server/threadcast-mcp.js
packages/plugin-threadcast/codex/server/threadcast-mcp.js
```

## 3. Test Claude Code

Start Claude Code with the Claude plugin root and point ThreadCast at localhost:

```bash
THREADCAST_API_URL=http://localhost:5173 \
THREADCAST_CONFIG_DIR=$HOME/.threadcast-dev \
claude --plugin-dir ./packages/plugin-threadcast/claude
```

Inside Claude Code:

```text
/threadcast:login
/threadcast:status
/threadcast:share
/threadcast:share-recent
```

Expected login behavior:

- Browser opens `http://localhost:5173/local-login`.
- Auth writes local test credentials under `$HOME/.threadcast-dev`.
- Share uploads to the local web server.

## 4. Test Codex

Codex plugin MCP servers do not inherit `THREADCAST_API_URL` from the shell reliably. Use the local MCP config before starting Codex:

```bash
bun plugin:codex:local
bun build:plugin
```

Then fully restart Codex:

```bash
codex -C /Users/iamsegbedji/work/projects/threadcast
```

Install or enable the plugin from Codex:

```text
/plugins
```

Use the `ThreadCast` marketplace entry and install/enable `ThreadCast`.

Check that the MCP server is attached:

```text
/mcp
```

Expected MCP entry:

```text
threadcast-local
```

Use the command-like skills:

```text
$threadcast:threadcast-login
$threadcast:threadcast-status
$threadcast:threadcast-share
$threadcast:threadcast-share-recent
```

Expected login behavior:

- Browser opens `http://localhost:5173/local-login`.
- Auth writes local test credentials under `$HOME/.threadcast-dev`.
- Share uploads to the local web server.

After changing Codex plugin files, run `bun build:plugin`, fully restart Codex, and reinstall or toggle the plugin in `/plugins`. Local marketplaces do not refresh like Git marketplaces.

Before committing or testing production defaults, switch Codex back to the production MCP config:

```bash
bun plugin:prepare:dist
```

That command builds both bundled MCP servers, restores the production Codex MCP config, and validates the Claude marketplace manifest.

## 5. Direct MCP Smoke Test

Use this to verify the bundled MCP server without Claude Code or Codex:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n' \
  | THREADCAST_API_URL=http://localhost:5173 \
    THREADCAST_CONFIG_DIR=$HOME/.threadcast-dev \
    bun run packages/plugin-threadcast/codex/server/threadcast-mcp.js
```

Expected output includes tools:

```text
threadcast.status
threadcast.login
threadcast.logout
threadcast.list_recent_sessions
threadcast.share_session
```

## Production Defaults

Without `THREADCAST_API_URL`, both plugins use:

```text
https://threadcast.dev
```

Use `THREADCAST_CONFIG_DIR=$HOME/.threadcast-dev` during local testing so local credentials do not overwrite your normal ThreadCast login.

For Codex, local `THREADCAST_API_URL` and `THREADCAST_CONFIG_DIR` are set by `packages/plugin-threadcast/codex/.mcp.local.json`. The active file is `packages/plugin-threadcast/codex/.mcp.json`, selected with `bun plugin:codex:local` or `bun plugin:codex:prod`.

## Release Flow

Use this when publishing a new plugin version:

```bash
bun plugin:release 0.0.2
git add .
git commit -m "[infra] release plugin v0.0.2"
git tag v0.0.2
git push
git push --tags
```

`bun plugin:release` updates these version fields together:

- `packages/plugin-threadcast/package.json`
- `packages/plugin-threadcast/claude/.claude-plugin/plugin.json`
- `packages/plugin-threadcast/codex/.codex-plugin/plugin.json`

It then builds the bundled MCP servers, restores the production Codex MCP config, and validates the Claude marketplace manifest.

Public install and update commands live in the repo [README](../README.md#agent-plugins).
