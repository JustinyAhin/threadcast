# Threadcast Web

SvelteKit 2 app deployed to Cloudflare Workers.

## Tech Stack

- **Framework**: SvelteKit 2 with Cloudflare adapter
- **Styling**: Tailwind CSS 4
- **Deployment**: Cloudflare Workers (Wrangler)

## Documentation

When you need to check Svelte or SvelteKit documentation, use these LLM-optimized docs:

- [Svelte documentation](https://svelte.dev/docs/svelte/llms.txt)
- [SvelteKit documentation](https://svelte.dev/docs/kit/llms.txt)

### Authentication

**Never put auth checks in `+layout.server.ts`** — layout load functions can be skipped during client-side navigation, bypassing auth checks. See: https://github.com/sveltejs/kit/issues/6315

Instead:

- Put auth checks in each `+page.server.ts` load function
- Or use `hooks.server.ts` to protect routes globally

## After all edits are done, run checks:

1. **Format + lint** all changed files:

```bash
cd packages/web && bun run format && bunx eslint src/path/to/file1.ts src/path/to/file2.svelte --fix
```

2. **Type check**:

```bash
cd packages/web && bun run check
```

## Code Conventions

### Components

- Import reusable components from `$lib/components/`
- Add `cursor-pointer` class to clickable elements when needed

## Commands

```bash
bun dev              # Start dev server
bun build            # Production build
bun preview          # Preview via Wrangler
bun check            # Run svelte-check
bun lint             # Prettier + ESLint check
bun format           # Format with Prettier
bun gen              # Generate Wrangler types
```
