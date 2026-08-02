import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createFileClickStore } from "./file-store";
import { parseClickLine, serializeClickEvent } from "./log-format";
import type { ClickEvent } from "./types";

let directory: string;
let logPath: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "linkfile-test-"));
  logPath = join(directory, "nested", "clicks.log");
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("createFileClickStore", () => {
  it("reports itself as a persistent file store", () => {
    const store = createFileClickStore(logPath);

    expect(store.kind).toBe("file");
    expect(store.persistent).toBe(true);
    expect(store.disabledReason).toBeNull();
  });

  it("returns an empty aggregate before any click is recorded", async () => {
    await expect(createFileClickStore(logPath).aggregate()).resolves.toEqual([]);
  });

  it("creates missing parent directories on the first write", async () => {
    const store = createFileClickStore(logPath);
    await store.record({ slug: "github", clickedAt: "2026-08-02T12:00:00.000Z" });

    await expect(readFile(logPath, "utf8")).resolves.toBe('{"slug":"github","clickedAt":"2026-08-02T12:00:00.000Z"}\n');
  });

  it("appends one JSON line per click and reads them all back", async () => {
    const store = createFileClickStore(logPath);

    await store.record({ slug: "github", clickedAt: "2026-08-02T12:00:00.000Z" });
    await store.record({ slug: "github", clickedAt: "2026-08-02T13:00:00.000Z" });
    await store.record({ slug: "writing", clickedAt: "2026-08-02T14:00:00.000Z" });

    const contents = await readFile(logPath, "utf8");
    expect(contents.trim().split("\n")).toHaveLength(3);

    const rows = await store.aggregate(new Date("2026-08-02T15:00:00.000Z"));
    expect(rows).toEqual([
      { slug: "github", total: 2, last7Days: 2, last30Days: 2, lastClickedAt: "2026-08-02T13:00:00.000Z" },
      { slug: "writing", total: 1, last7Days: 1, last30Days: 1, lastClickedAt: "2026-08-02T14:00:00.000Z" },
    ]);
  });

  it("survives concurrent appends without losing records", async () => {
    const store = createFileClickStore(logPath);

    await Promise.all(
      Array.from({ length: 25 }, (_unused, index) =>
        store.record({ slug: "github", clickedAt: new Date(Date.UTC(2026, 7, 2, 12, 0, index)).toISOString() }),
      ),
    );

    const rows = await store.aggregate(new Date("2026-08-02T13:00:00.000Z"));
    expect(rows[0]?.total).toBe(25);
  });

  it("skips malformed lines instead of failing", async () => {
    await writeFile(
      join(directory, "clicks.log"),
      [
        '{"slug":"github","clickedAt":"2026-08-02T12:00:00.000Z"}',
        "",
        "   ",
        "not json at all",
        '{"slug":"github"}',
        '{"clickedAt":"2026-08-02T12:00:00.000Z"}',
        '{"slug":"github","clickedAt":"nonsense"}',
        '{"slug":"","clickedAt":"2026-08-02T12:00:00.000Z"}',
        '["github","2026-08-02T12:00:00.000Z"]',
        '{"slug":"github","clickedAt":"2026-08-02T12:30:00.00', // truncated write
        '{"slug":"writing","clickedAt":"2026-08-02T12:45:00.000Z"}',
      ].join("\n"),
      "utf8",
    );

    const rows = await createFileClickStore(join(directory, "clicks.log")).aggregate(
      new Date("2026-08-02T13:00:00.000Z"),
    );

    expect(rows).toEqual([
      { slug: "github", total: 1, last7Days: 1, last30Days: 1, lastClickedAt: "2026-08-02T12:00:00.000Z" },
      { slug: "writing", total: 1, last7Days: 1, last30Days: 1, lastClickedAt: "2026-08-02T12:45:00.000Z" },
    ]);
  });

  it("tolerates a log with no trailing newline", async () => {
    const file = join(directory, "clicks.log");
    await writeFile(file, '{"slug":"github","clickedAt":"2026-08-02T12:00:00.000Z"}', "utf8");

    const rows = await createFileClickStore(file).aggregate(new Date("2026-08-02T13:00:00.000Z"));
    expect(rows[0]?.total).toBe(1);
  });

  it("resolves relative paths against the working directory", async () => {
    const store = createFileClickStore("relative/path/clicks.log");

    expect(store.kind).toBe("file");
    await expect(store.aggregate()).resolves.toEqual([]);
  });
});

describe("click log format", () => {
  it("round-trips an event", () => {
    const event = { slug: "github", clickedAt: "2026-08-02T12:00:00.000Z" };

    expect(parseClickLine(serializeClickEvent(event))).toEqual(event);
  });

  it("writes exactly one trailing newline and nothing else", () => {
    expect(serializeClickEvent({ slug: "a", clickedAt: "2026-08-02T12:00:00.000Z" })).toBe(
      '{"slug":"a","clickedAt":"2026-08-02T12:00:00.000Z"}\n',
    );
  });

  it("writes only the slug and timestamp, never extra fields handed to it", () => {
    const event = { slug: "a", clickedAt: "2026-08-02T12:00:00.000Z", ip: "203.0.113.1" } as ClickEvent;

    expect(serializeClickEvent(event)).not.toContain("203.0.113.1");
  });
});
