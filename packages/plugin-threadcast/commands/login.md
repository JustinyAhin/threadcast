Authenticate ThreadCast with GitHub so local Claude Code sessions can be shared.

1. Call `threadcast.login`.
2. If the tool returns success, tell the user which GitHub account is now connected.
3. If the tool falls back to device login, show the exact verification URL and user code and tell the user to run `/threadcast:login` again after approving access.
