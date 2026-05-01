# ThreadCast

Share your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions as beautiful, interactive web pages.

ThreadCast transforms recorded Claude Code conversations into shareable threads — complete with syntax highlighting, tool call rendering, diff views, and cost tracking.

## How It Works

1. **Install** — Add the Claude Code plugin locally
2. **Discover** — The local MCP server scans your Claude Code sessions
3. **Share** — Run a slash command and get a shareable link

## Packages

| Package | Description |
|---------|-------------|
| `packages/web` | SvelteKit app hosted on Cloudflare Workers — displays threads |
| `packages/local-core` | Shared local discovery, parsing, auth, and upload logic for native clients |
| `packages/mcp` | Local stdio MCP server that exposes ThreadCast tools to Claude Code |
| `packages/plugin-threadcast` | Claude Code plugin with slash commands backed by the local MCP server |
| `packages/shared` | Shared Zod schemas, types, and utilities |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Web**: SvelteKit 2, Tailwind CSS 4, Cloudflare Workers/D1/R2
- **Claude Code**: local stdio MCP server packaged as a plugin
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

# Build and test the Claude Code plugin
bun build:plugin
claude --plugin-dir ./packages/plugin-threadcast
```

### Environment Variables

Local dev uses a `.env` file. Production variables are set in the Cloudflare dashboard (Settings > Build > Build variables).

**Web**:
- `BETTER_AUTH_URL` — Base URL for auth
- `BETTER_AUTH_SECRET` — Session secret
- `GITHUB_CLIENT_ID` — GitHub OAuth app ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth app secret
- `PUBLIC_OG_URL` — OG image service URL

## Commands

```bash
# Development
bun dev:web              # Start web dev server

# Build
bun build                # Build all packages
bun build:plugin         # Bundle the Claude Code plugin server

# Quality
bun run --filter '*' typecheck   # Typecheck all packages
bun run --filter @threadcast/web lint      # Lint web package
bun run --filter @threadcast/web format    # Format web package

# Database
bun run --filter @threadcast/web atlas:diff         # Generate migration from schema changes
bun run --filter @threadcast/web db:migrate:local   # Apply migrations locally
bun run --filter @threadcast/web db:migrate:remote  # Apply migrations to production
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
│   ├── local-core/              # Local discovery, parsing, auth, upload logic
│   ├── mcp/                     # Local MCP server
│   ├── plugin-threadcast/       # Claude Code plugin package
│   └── shared/
│       └── src/                 # Zod schemas, types, pricing
```

## License

All rights reserved.
