import chalk from "chalk";
import { clearConfig, loadConfig } from "../auth/config.js";

export async function logoutCommand() {
  const existing = await loadConfig();
  if (!existing) {
    console.log(chalk.dim("Not logged in."));
    return;
  }

  await clearConfig();
  console.log(
    chalk.green(`Logged out from ${chalk.bold(existing.githubUsername)}.`)
  );
}
