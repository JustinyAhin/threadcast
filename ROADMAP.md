# ThreadCast Roadmap

## Next

- **Bring your own R2** — let users store shared session data in their own Cloudflare R2 bucket instead of ThreadCast-hosted storage.
- **Friendly slugs** — let users generate readable thread URLs, while keeping the current ID links working.
- **Better session titles** — generate nicer titles for Claude Code and Codex sessions, preferably with a cheap model from the user's local agent setup.

## Later

- Thread settings for title, slug, visibility, and storage.
- Better profile/search support for titles and slugs.

## Open Questions

- Should slugs be global or scoped per user?
- Should friendly URLs look like `/threads/{slug}` or `/u/{username}/{slug}`?
- Should title generation happen locally before upload or server-side after upload?
