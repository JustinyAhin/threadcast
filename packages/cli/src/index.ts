#!/usr/bin/env node
import { Command } from "commander";
import { shareCommand } from "./commands/share.js";
import { listCommand } from "./commands/list.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";

const program = new Command();

program
  .name("threadcast")
  .description("Share Claude Code sessions as readable web pages")
  .version("0.1.0");

program
  .command("share")
  .description("Share a Claude Code session")
  .argument("[session-id]", "Session ID to share directly")
  .option("--public", "Make thread publicly visible")
  .action((sessionId?: string, opts?: { public?: boolean }) =>
    shareCommand(sessionId, { isPublic: opts?.public })
  );

program
  .command("list")
  .description("List recent local Claude Code sessions")
  .action(() => listCommand());

program
  .command("login")
  .description("Authenticate with GitHub")
  .action(() => loginCommand());

program
  .command("logout")
  .description("Clear stored credentials")
  .action(() => logoutCommand());

program
  .command("whoami")
  .description("Show current auth status")
  .action(() => whoamiCommand());

program.parse();
