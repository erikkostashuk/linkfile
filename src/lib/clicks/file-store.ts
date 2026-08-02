import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

import { aggregateClicks } from "./aggregate";
import { parseClickLine, serializeClickEvent } from "./log-format";
import type { ClickAggregate, ClickEvent, ClickStore } from "./types";

/** Default location of the append-only click log, relative to the project root. */
export const DEFAULT_CLICK_LOG_PATH = ".data/clicks.log";

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as NodeJS.ErrnoException).code === "ENOENT";
}

/**
 * Append-only JSON Lines click store for local development, VPS and Docker.
 *
 * One line per click keeps writes atomic enough for a single process, keeps the
 * file greppable, and means a partially written tail can never corrupt earlier
 * records. Mount the containing directory as a volume to persist it.
 */
export function createFileClickStore(logPath: string = DEFAULT_CLICK_LOG_PATH): ClickStore {
  // `turbopackIgnore` tells the bundler's file tracer that this path is resolved
  // at runtime from the working directory. Without it the tracer assumes the
  // whole project directory is a dependency and copies it into the standalone
  // build output.
  const absolutePath = isAbsolute(logPath) ? logPath : resolve(/* turbopackIgnore: true */ process.cwd(), logPath);

  return {
    kind: "file",
    persistent: true,
    disabledReason: null,

    async record(event: ClickEvent): Promise<void> {
      await mkdir(dirname(absolutePath), { recursive: true });
      await appendFile(absolutePath, serializeClickEvent(event), "utf8");
    },

    async aggregate(now: Date = new Date()): Promise<ClickAggregate[]> {
      let contents: string;

      try {
        contents = await readFile(absolutePath, "utf8");
      } catch (error) {
        if (isNotFound(error)) {
          // No clicks recorded yet is a normal, empty state — not an error.
          return [];
        }
        throw error;
      }

      const events: ClickEvent[] = [];

      for (const line of contents.split("\n")) {
        const event = parseClickLine(line);

        if (event !== null) {
          events.push(event);
        }
      }

      return aggregateClicks(events, now);
    },
  };
}
