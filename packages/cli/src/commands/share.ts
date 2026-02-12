import chalk from "chalk";
import ora from "ora";
import { select } from "@inquirer/prompts";
import { loadConfig } from "../auth/config.js";
import { parseSession } from "../parser/index.js";
import { discoverSessions, findSession } from "./session-discovery.js";
import { uploadThread } from "../uploader/api-client.js";
import { MAX_THREAD_SIZE_BYTES } from "@threadcast/shared";
import { stat } from "node:fs/promises";

const timeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const shareCommand = async (
  sessionId?: string,
  opts?: { isPublic?: boolean }
) => {
  // Check auth
  const config = await loadConfig();
  if (!config) {
    console.log(
      chalk.red("Not logged in.") +
        ` Run ${chalk.cyan("threadcast login")} first.`
    );
    process.exit(1);
  }

  let sessionPath: string;

  if (sessionId) {
    // Direct share by ID
    const session = await findSession(sessionId);
    if (!session) {
      console.log(chalk.red(`Session not found: ${sessionId}`));
      process.exit(1);
    }
    sessionPath = session.path;
  } else {
    // Interactive: pick a session
    const spinner = ora("Scanning sessions...").start();
    const sessions = await discoverSessions();
    spinner.stop();

    if (sessions.length === 0) {
      console.log(chalk.dim("No Claude Code sessions found."));
      return;
    }

    const choices = sessions.slice(0, 30).map((s) => {
      const date = new Date(s.lastModified);
      const ago = timeAgo(date);
      const project = s.projectPath.split("/").pop() || "?";
      const preview = s.firstMessage.slice(0, 50);

      return {
        name: `${chalk.cyan(project)} ${preview}${s.firstMessage.length > 50 ? "..." : ""} ${chalk.dim(`(${s.messageCount} msgs, ${ago})`)}`,
        value: s.path,
      };
    });

    sessionPath = await select({
      message: "Select a session to share:",
      choices,
      pageSize: 15,
    });
  }

  // Check file size
  const fileStat = await stat(sessionPath);
  if (fileStat.size > MAX_THREAD_SIZE_BYTES) {
    console.log(
      chalk.yellow(
        `Warning: Session file is ${(fileStat.size / 1024 / 1024).toFixed(1)} MB. Processing may take a moment.`
      )
    );
  }

  // Parse
  const parseSpinner = ora("Parsing session...").start();
  let threadData;
  try {
    threadData = await parseSession(sessionPath, {
      githubUsername: config.githubUsername,
      githubAvatarUrl: config.githubAvatarUrl,
    });
    parseSpinner.succeed(
      `Parsed: ${threadData.turns.length} turns, ${threadData.metadata.toolsUsed.length} tools used`
    );
  } catch (err: any) {
    parseSpinner.fail(`Failed to parse: ${err.message}`);
    process.exit(1);
  }

  threadData.metadata.visibility = opts?.isPublic ? "public" : "private";

  // Preview
  console.log();
  console.log(chalk.bold("  Title:    ") + threadData.metadata.title);
  console.log(chalk.bold("  Project:  ") + threadData.metadata.projectName);
  console.log(chalk.bold("  Duration: ") + threadData.metadata.duration);
  console.log(
    chalk.bold("  Tokens:   ") +
      `${threadData.metadata.totalTokens.input.toLocaleString()} in / ${threadData.metadata.totalTokens.output.toLocaleString()} out`
  );
  console.log(
    chalk.bold("  Models:   ") + threadData.metadata.models.join(", ")
  );
  console.log(
    chalk.bold("  Tools:    ") + threadData.metadata.toolsUsed.join(", ")
  );
  console.log();

  // Upload
  const uploadSpinner = ora("Uploading...").start();
  try {
    const result = await uploadThread({ threadData, token: config.githubToken });
    uploadSpinner.succeed("Uploaded!");
    console.log(
      `\n  ${chalk.bold("URL:")} ${chalk.cyan.underline(result.url)}\n`
    );
  } catch (err: any) {
    uploadSpinner.fail(`Upload failed: ${err.message}`);
    process.exit(1);
  }
};

export { shareCommand };
