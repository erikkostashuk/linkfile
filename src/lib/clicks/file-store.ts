import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute } from "node:path";

import { aggregateClicks } from "./aggregate";
import { parseClickLine, serializeClickEvent } from "./log-format";
import type { ClickAggregate, ClickEvent, ClickStore } from "./types";

export const DEFAULT_CLICK_LOG_PATH = ".data/clicks.log";

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export function createFileClickStore(
  logPath: string = DEFAULT_CLICK_LOG_PATH,
): ClickStore {
  const workingDirectory = process.cwd();
  const absolutePath = isAbsolute(logPath)
    ? logPath
    : `${workingDirectory}/${logPath}`;

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
