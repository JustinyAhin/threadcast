# ThreadCast

Share your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions as beautiful, interactive web pages.

ThreadCast transforms recorded Claude Code conversations into shareable threads — complete with syntax highlighting, tool call rendering, diff views, and cost tracking.

## How It Works

1. **Discover** — The CLI scans your local Claude Code sessions
2. **Preview** — See metadata, token usage, and cost estimates before sharing
3. **Share** — Upload with a single keystroke and get a shareable link

## Packages

| Package | Description |
|---------|-------------|
| `packages/web` | SvelteKit app hosted on Cloudflare Workers — displays threads |
| `packages/cli` | Terminal UI for discovering, previewing, and uploading sessions |
| `packages/local-core` | Shared local discovery, parsing, auth, and upload logic for native clients |
| `packages/mcp` | Local stdio MCP server that exposes ThreadCast tools to Claude Code |
| `packages/plugin-threadcast` | Claude Code plugin with slash commands backed by the local MCP server |
| `packages/shared` | Shared Zod schemas, types, and utilities |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Web**: SvelteKit 2, Tailwind CSS 4, Cloudflare Workers/D1/R2
- **CLI**: Solid.js + [OpenTUI](https://github.com/anthropics/opentui) (terminal UI)
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
bun --filter web db:migrate:local

# Start the web dev server
bun dev:web

# Run the CLI
bun cli
```

### Environment Variables

Local dev uses a `.env` file. Production variables are set in the Cloudflare dashboard (Settings > Build > Build variables).

**Web**:
- `BETTER_AUTH_URL` — Base URL for auth
- `BETTER_AUTH_SECRET` — Session secret
- `GITHUB_CLIENT_ID` — GitHub OAuth app ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth app secret
- `PUBLIC_OG_URL` — OG image service URL

**CLI**:
- `API_BASE_URL` — Web API base URL

## Commands

```bash
# Development
bun dev:web              # Start web dev server
bun cli                  # Run CLI in dev mode

# Build
bun build                # Build all packages
bun build:plugin         # Bundle the Claude Code plugin server

# Quality
bun run --filter '*' typecheck   # Typecheck all packages
bun --filter web lint            # Lint web package
bun --filter web format          # Format web package

# Database
bun --filter web atlas:diff      # Generate migration from schema changes
bun --filter web db:migrate:local   # Apply migrations locally
bun --filter web db:migrate:remote  # Apply migrations to production
```

## CLI Usage

```bash
threadcast                        # Open the TUI — browse, preview, share
threadcast share --today          # Share all sessions from today
threadcast share --days 7         # Share sessions from the last 7 days
threadcast share --since 2025-01-01  # Share sessions since a date
threadcast share --force          # Re-share already shared sessions
threadcast logout                 # Clear stored credentials
```

## Claude Code Plugin

ThreadCast can also be used from inside Claude Code via the bundled plugin.

```bash
# Build the plugin's bundled MCP server
bun build:plugin

# Start Claude Code with the plugin directory
claude --plugin-dir ./packages/plugin-threadcast
```

This adds the following commands inside Claude Code:

- `/threadcast:login`
- `/threadcast:logout`
- `/threadcast:status`
- `/threadcast:share`
- `/threadcast:share-recent`

### Keyboard Shortcuts (TUI)

| Key | Action |
|-----|--------|
| `j` / `k` or arrows | Navigate sessions |
| `Enter` | Open / execute |
| `s` | Share session |
| `/` | Search / filter |
| `l` | Log in with GitHub |
| `Esc` | Back |
| `q` / `Ctrl+C` | Quit |

## Thread Rendering

ThreadCast renders each Claude Code tool with a dedicated visual component:

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
│   ├── cli/
│   │   └── src/
│   │       ├── views/           # TUI screens
│   │       ├── parser/          # JSONL → ThreadData
│   │       ├── auth/            # GitHub device flow
│   │       └── uploader/        # API client
│   └── shared/
│       └── src/                 # Zod schemas, types, pricing
```

## License

All rights reserved.
