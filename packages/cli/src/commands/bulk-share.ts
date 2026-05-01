import { loadConfig } from "../auth/config.js";
import { discoverSessions } from "../lib/session-discovery.js";
import { getCachedThread } from "../lib/thread-cache.js";
import { uploadThread } from "../uploader/api-client.js";
import {
  loadSharedSessions,
  saveSharedSession,
} from "../lib/shared-sessions.js";
import { filterSessionsByAge, filterSessionsSince } from "../lib/date-filter.js";
import type { SessionSummary } from "@threadcast/shared";

type BulkShareArgs = {
  today?: boolean;
  days?: number;
  since?: string;
  force?: boolean;
};

const parseArgs = (argv: string[]): BulkShareArgs => {
  const args: BulkShareArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--today") {
      args.today = true;
    } else if (arg === "--days" && argv[i + 1]) {
      args.days = parseInt(argv[i + 1], 10);
      if (isNaN(args.days) || args.days <= 0) {
        console.error("Error: --days must be a positive integer");
        process.exit(1);
      }
      i++;
    } else if (arg === "--since" && argv[i + 1]) {
      args.since = argv[i + 1];
      const parsed = new Date(args.since);
      if (isNaN(parsed.getTime())) {
        console.error("Error: --since must be a valid date (e.g. 2026-02-15)");
        process.exit(1);
      }
      i++;
    } else if (arg === "--force") {
      args.force = true;
    }
  }
  return args;
};

const runBulkShare = async (argv: string[]): Promise<void> => {
  const args = parseArgs(argv);

  if (!args.today && !args.days && !args.since) {
    console.log("Usage: threadcast share [options]");
    console.log();
    console.log("Options:");
    console.log("  --today          Share sessions from today");
    console.log("  --days <N>       Share sessions from the last N days");
    console.log("  --since <DATE>   Share sessions since a specific date");
    console.log("  --force          Re-share already shared sessions");
    process.exit(1);
  }

  const config = await loadConfig();
  if (!config) {
    console.error("Error: Not logged in. Run `threadcast` and press `l` to login first.");
    process.exit(1);
  }

  console.log("Discovering sessions...");
  const allSessions = await discoverSessions();

  let filtered: SessionSummary[];
  if (args.today) {
    filtered = filterSessionsByAge({ sessions: allSessions, days: 1 });
  } else if (args.days) {
    filtered = filterSessionsByAge({ sessions: allSessions, days: args.days });
  } else {
    filtered = filterSessionsSince({
      sessions: allSessions,
      since: new Date(args.since!),
    });
  }

  const shared = await loadSharedSessions();
  const toShare = args.force
    ? filtered
    : filtered.filter((s) => !(s.sessionId in shared));

  if (toShare.length === 0) {
    console.log("No sessions to share.");
    process.exit(0);
  }

  console.log(`Found ${toShare.length} session(s) to share.\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < toShare.length; i++) {
    const session = toShare[i];
    const label = session.firstMessage.slice(0, 60) || "(no title)";
    const progress = `[${i + 1}/${toShare.length}]`;

    try {
      const data = await getCachedThread({
        filePath: session.path,
        uploader: {
          githubUsername: config.githubUsername,
          githubAvatarUrl: config.githubAvatarUrl,
        },
      });

      const result = await uploadThread({
        threadData: data,
        token: config.threadcastToken,
      });

      await saveSharedSession({ sessionId: session.sessionId, url: result.url });
      console.log(`${progress} Shared: ${label} → ${result.url}`);
      succeeded++;
    } catch (err: any) {
      console.error(`${progress} Failed: ${label} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${succeeded} shared, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
};

export { runBulkShare };
