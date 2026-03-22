Authenticate ThreadCast with GitHub so local Claude Code sessions can be shared.

1. Call `threadcast.login`.
2. If the tool returns a pending login, show the exact verification URL and user code.
3. Tell the user to complete GitHub approval in their browser.
4. Tell the user to run `/threadcast:login` again after approving access.
5. If the tool returns success, tell the user which GitHub account is now connected.
