import { render } from "@opentui/solid";
import { App } from "./app.js";
import { clearConfig, loadConfig } from "./auth/config.js";

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

render(() => <App />, { useMouse: false });
