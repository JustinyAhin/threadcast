import chalk from "chalk";
import { loadConfig } from "../auth/config.js";

const whoamiCommand = async () => {
  const config = await loadConfig();
  if (!config) {
    console.log(chalk.dim("Not logged in. Run ") + chalk.cyan("threadcast login"));
    return;
  }

  console.log(
    `\n  ${chalk.bold("Username:")} ${config.githubUsername}` +
      `\n  ${chalk.bold("Avatar:")}   ${config.githubAvatarUrl}\n`
  );
};

export { whoamiCommand };
