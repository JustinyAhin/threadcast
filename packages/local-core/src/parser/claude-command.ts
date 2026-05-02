const extractClaudeCommandTag = (opts: {
  text: string;
  tag: string;
}): string | null => {
  const pattern = new RegExp(`<${opts.tag}>\\s*([\\s\\S]*?)\\s*</${opts.tag}>`);
  const match = opts.text.match(pattern);
  return match?.[1]?.trim() || null;
};

const normalizeClaudeCommandText = (text: string): string => {
  const trimmed = text.trim();
  const commandMessage = extractClaudeCommandTag({
    text: trimmed,
    tag: "command-message",
  });
  const commandName = extractClaudeCommandTag({
    text: trimmed,
    tag: "command-name",
  });
  const command = commandMessage ?? commandName;

  if (!command) return text;

  return `[command] ${command}`;
};

export { normalizeClaudeCommandText };
