import chalk from "chalk";
import ora from "ora";
import { discoverSessions } from "./session-discovery.js";

export async function listCommand() {
  const spinner = ora("Scanning sessions...").start();
  const sessions = await discoverSessions();
  spinner.stop();

  if (sessions.length === 0) {
    console.log(chalk.dim("No Claude Code sessions found."));
    return;
  }

  console.log(
    chalk.bold(`\n  Found ${sessions.length} session${sessions.length === 1 ? "" : "s"}:\n`)
  );

  const maxToShow = 20;
  const toShow = sessions.slice(0, maxToShow);

  for (const session of toShow) {
    const date = new Date(session.lastModified);
    const ago = timeAgo(date);
    const size = formatBytes(session.sizeBytes);
    const id = chalk.dim(session.sessionId.slice(0, 8));
    const project = chalk.cyan(session.projectPath.split("/").pop() || "?");
    const preview = session.firstMessage.slice(0, 60);
    const msgs = chalk.dim(`${session.messageCount} msgs`);

    console.log(
      `  ${id}  ${project}  ${chalk.white(preview)}${session.firstMessage.length > 60 ? chalk.dim("...") : ""}  ${msgs}  ${chalk.dim(ago)}  ${chalk.dim(size)}`
    );
  }

  if (sessions.length > maxToShow) {
    console.log(
      chalk.dim(`\n  ... and ${sessions.length - maxToShow} more`)
    );
  }
  console.log();
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
