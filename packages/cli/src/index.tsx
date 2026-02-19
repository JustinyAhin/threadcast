import { render } from "@opentui/solid";
import { App } from "./app.js";
import { clearConfig, loadConfig } from "./auth/config.js";
import { runBulkShare } from "./commands/bulk-share.js";

const subcommand = process.argv[2];

if (subcommand === "logout") {
  const config = await loadConfig();
  if (!config) {
    console.log("Not logged in.");
  } else {
    await clearConfig();
    console.log("Logged out successfully.");
  }
  process.exit(0);
}

if (subcommand === "share" && process.argv.length > 3) {
  await runBulkShare(process.argv.slice(3));
}

render(() => <App />, { useMouse: false });
