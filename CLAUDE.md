# Threadcast

Monorepo: `packages/web` (SvelteKit), `packages/mcp` (local MCP server), `packages/plugin-threadcast` (Claude Code plugin), `packages/local-core` (local session logic), `packages/shared` (shared types/utils).

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Tech Stack

- **Runtime/Package Manager**: Bun (not npm/pnpm)
- **Monorepo**: Bun workspaces
- **Validation**: Zod (in `@threadcast/shared`)

## Workflow

### Token efficiency rules

- **Never re-read a file you just edited.** You already know its contents.
- **Batch all formatting/linting at the end**, not after each file. Run once when all edits are done.
- **Before using Edit, verify the exact string exists** in what you already read. If the file was modified since you read it, re-read it once — not repeatedly.

## Code Conventions

### Naming

- File names in **kebab-case** (e.g. `api-client.ts`, `session-discovery.ts`)
- Component files in **kebab-case** (e.g. `thread-card.svelte`, `user-avatar.svelte`)

### TypeScript

- Use `type` instead of `interface`
- All exports at the end of the file, not inline
- Use arrow functions instead of function declarations
- Functions with more than one parameter should use object arguments
- Keep types in a separate `types.ts` file unless a type is only used in one file

```typescript
// Good
type User = {
  id: string;
  name: string;
};

const createUser = () => { ... };

export { createUser, type User };

// Bad
export interface User { ... }
export const createUser = () => { ... };
```

```typescript
// Good - object argument for multiple parameters
const sendEmail = (opts: { to: string; subject: string; body: string }) => { ... };

// Bad - multiple positional parameters
const sendEmail = (to: string, subject: string, body: string) => { ... };
```

### Database (SQLite / Cloudflare D1)

- All `userId` fields reference `user.id` with `onDelete: 'cascade'`
- Use `integer('...', { mode: 'timestamp' })` for timestamps
- Use cuid2 for primary keys:

```typescript
import { createId } from '@paralleldrive/cuid2';

id: text('id').primaryKey().$defaultFn(() => createId()),
createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
```

### Environment Variables

- **Local dev**: `.env` file (gitignored)
- **Production**: Set in the Cloudflare dashboard (Settings > Build > Build variables)

**Never read `.env` files.** When environment variables need to be added or updated, describe what's needed and let the user handle it directly. This prevents accidental exposure of secrets.

## Commands

```bash
bun build              # Build all packages
bun dev:web            # Start web dev server
bun run --filter '*' typecheck  # Typecheck all packages
```


## Git

- Do not add `Co-Authored-By` lines to commit messages.
- Prefix every commit with a topic tag in square brackets so history is greppable. Pick one:
  - `[seo]` — titles, meta, sitemap, schema, internal linking for rankings
  - `[content]` — blog posts, copy, landing-page text, FAQ
  - `[tools]` — free tool definitions and templates
  - `[feat]` — new app features
  - `[fix]` — bug fixes
  - `[ui]` — styling, layout, components
  - `[db]` — schema, migrations, queries
  - `[infra]` — deploy, wrangler, build, hooks
  - `[chore]` — deps, lockfile, internal scripts, tooling
- Examples: `[seo] rewrite competitor comparison titles for search intent`, `[content] add menu engineering blog post`, `[fix] preserve dialog tab across close`.
- Keep commit descriptions short. Add a longer body only when it provides real value/context (non-obvious why, tricky tradeoff, follow-up notes).


## Fetching Pages

When you need to fetch a page's content, use this order:

1. `curl https://defuddle.md/[url]` — preferred, returns clean markdown
2. `bunx playbooks get [url]` — fallback if defuddle fails or result is poor
3. WebFetch tool — last resort
