import chalk from "chalk";
import ora from "ora";
import { githubDeviceFlow } from "../auth/github-device-flow.js";
import { saveConfig, loadConfig } from "../auth/config.js";

export async function loginCommand() {
  const existing = await loadConfig();
  if (existing) {
    console.log(
      chalk.yellow(
        `Already logged in as ${chalk.bold(existing.githubUsername)}. Run ${chalk.cyan("threadcast logout")} first to switch accounts.`
      )
    );
    return;
  }

  console.log(chalk.bold("\nThreadCast — GitHub Login\n"));

  const spinner = ora("Requesting device code...").start();

  try {
    const config = await githubDeviceFlow((code, uri) => {
      spinner.stop();
      console.log(
        chalk.bold(`\n  Enter code: ${chalk.cyan.bold(code)}\n`)
      );
      console.log(`  Open: ${chalk.underline(uri)}\n`);
      console.log(chalk.dim("  (Browser should open automatically)\n"));
      spinner.start("Waiting for authorization...");
    });

    spinner.succeed(
      `Logged in as ${chalk.bold(config.githubUsername)}`
    );
    await saveConfig(config);
  } catch (err: any) {
    spinner.fail(err.message);
    process.exit(1);
  }
}
