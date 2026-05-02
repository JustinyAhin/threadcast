Share the most recent Claude Code session for the current project using ThreadCast.

1. Call `threadcast.status`.
2. If the user is not authenticated or has a pending login, call `threadcast.login`.
3. If `threadcast.login` returns a pending fallback device login, show the verification URL and user code and stop.
4. Call `threadcast.share_session` with `{ "source": "claude-code" }`.
5. Reply with the share URL and the shared session title only.
