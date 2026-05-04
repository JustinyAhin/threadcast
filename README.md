# ThreadCast

Share local [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and Codex sessions as readable web pages.

ThreadCast turns coding-agent conversations into public threads with syntax highlighting, tool call rendering, diff views, session metadata, and cost estimates.

## How It Works

1. **Install** — Add the Claude Code or Codex plugin marketplace
2. **Discover** — The local MCP server finds saved Claude Code and Codex sessions
3. **Share** — Run a plugin command and get a ThreadCast link

## Packages

| Package                      | Description                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| `packages/web`               | SvelteKit app hosted on Cloudflare Workers — displays threads              |
| `packages/local-core`        | Shared local discovery, parsing, auth, and upload logic for native clients |
| `packages/mcp`               | Local stdio MCP server that exposes ThreadCast tools to agent plugins      |
| `packages/plugin-threadcast` | Claude Code and Codex plugins backed by the local MCP server               |
| `packages/shared`            | Shared Zod schemas, types, and utilities                                   |
| `kb`                         | Project knowledge base and local development guides                        |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Web**: SvelteKit 2, Tailwind CSS 4, Cloudflare Workers/D1/R2
- **Agent integrations**: local stdio MCP server packaged for Claude Code and Codex
- **Database**: Cloudflare D1 (SQLite) with [Drizzle ORM](https://orm.drizzle.team)
- **Auth**: GitHub OAuth ([Better Auth](https://www.better-auth.com))
- **Validation**: [Zod](https://zod.dev)
- **Env management**: `.env` (local), Cloudflare dashboard (production)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.1+
- A Cloudflare account (for D1, R2, and Workers)
- A GitHub OAuth app (for authentication)

### Setup

```bash
# Install dependencies
bun install

# Set up environment variables (see Environment Variables below)
cp .env.example .env  # then fill in values

# Run database migrations locally
bun run --filter @threadcast/web db:migrate:local

# Start the web dev server
bun dev:web

# Build and test the plugins
bun build:plugin
```

For full local Claude Code and Codex e2e testing, see [Local Development](kb/local-dev.md).

### Environment Variables

Local dev uses a `.env` file. Production variables are set in the Cloudflare dashboard (Settings > Build > Build variables).

**Web**:

- `BETTER_AUTH_URL` — Base URL for auth
- `BETTER_AUTH_SECRET` — Session secret
- `GITHUB_CLIENT_ID` — GitHub OAuth app ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth app secret
- `PUBLIC_OG_URL` — OG image service URL
- `OG_SIGNING_SECRET` — Shared secret for signed OG image URLs; must match the OG service

## Commands

```bash
# Development
bun dev:web              # Start web dev server

# Build
bun build                # Build all packages
bun build:plugin         # Bundle plugin MCP servers
bun plugin:prepare:dist  # Build plugin bundles, restore prod Codex config, validate Claude marketplace
bun plugin:version 0.0.2 # Bump Claude, Codex, and plugin package versions
bun plugin:release 0.0.2 # Bump plugin versions and prepare distribution files

# Codex local plugin config
bun plugin:codex:local   # Point Codex plugin MCP at localhost
bun plugin:codex:prod    # Restore production Codex plugin MCP config

# Quality
bun run --filter '*' typecheck   # Typecheck all packages
bun run --filter @threadcast/web lint      # Lint web package
bun run --filter @threadcast/web format    # Format web package

# Database
bun run --filter @threadcast/web atlas:diff         # Generate migration from schema changes
bun run --filter @threadcast/web db:migrate:local   # Apply migrations locally
bun run --filter @threadcast/web db:migrate:remote  # Apply migrations to production
```

## Agent Plugins

ThreadCast can be used from Claude Code and Codex through plugin marketplaces. Both plugins run the same bundled local MCP server.

### Claude Code

```bash
claude plugin marketplace add JustinyAhin/threadcast --sparse .claude-plugin packages/plugin-threadcast/claude
claude plugin install threadcast@threadcast
```

This adds the following commands inside Claude Code:

- `/threadcast:login`
- `/threadcast:logout`
- `/threadcast:status`
- `/threadcast:share`
- `/threadcast:share-recent`
- `/threadcast:debug`

### Codex

```bash
codex plugin marketplace add JustinyAhin/threadcast --sparse .agents --sparse packages/plugin-threadcast/codex
```

Then open Codex, run `/plugins`, and install ThreadCast from the marketplace.

Command-like skills:

- `$threadcast:threadcast-login`
- `$threadcast:threadcast-logout`
- `$threadcast:threadcast-status`
- `$threadcast:threadcast-share`
- `$threadcast:threadcast-share-recent`
- `$threadcast:threadcast-debug`

For local plugin setup, localhost auth, and production release prep, see [Local Development](kb/local-dev.md).

## Plugin Releases

Plugin installs are cached by version. Use one command to keep the Claude, Codex, and plugin package versions in sync:

```bash
bun plugin:release 0.0.2
git add .
git commit -m "[infra] release plugin v0.0.2"
git tag v0.0.2
git push
git push --tags
```

Claude Code users update with:

```bash
claude plugin marketplace update threadcast
claude plugin update threadcast@threadcast
```

Codex users update with:

```bash
codex plugin marketplace upgrade threadcast
```

## Thread Rendering

ThreadCast renders each agent tool with a dedicated visual component:

- **Bash** — Command + output in a code block
- **Read** — File contents with syntax highlighting
- **Edit** — Inline diff view
- **Search** (Grep, Glob, WebSearch) — Formatted search results
- **Other tools** — Generic tool call display

Each thread also shows:

- Token usage and estimated cost per model
- Session duration and timestamps
- Models and tools used
- Message count

## Project Structure

```
threadcast/
├── packages/
│   ├── web/
│   │   ├── src/
│   │   │   ├── routes/          # SvelteKit pages & API
│   │   │   │   ├── api/threads/ # REST API (CRUD)
│   │   │   │   ├── threads/     # Thread gallery & viewer
│   │   │   │   ├── u/           # User profiles
│   │   │   │   └── login/       # GitHub OAuth
│   │   │   └── lib/
│   │   │       ├── server/      # Auth, DB, R2 storage
│   │   │       └── components/  # Svelte components
│   │   └── drizzle/             # Database migrations
│   ├── local-core/              # Local discovery, parsing, auth, upload logic
│   ├── mcp/                     # Local MCP server
│   ├── plugin-threadcast/       # Claude Code and Codex plugin package
│   └── shared/
│       └── src/                 # Zod schemas, types, pricing
├── kb/                          # Knowledge base docs
```
