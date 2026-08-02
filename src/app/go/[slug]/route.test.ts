import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { config } from "@/lib/config";

import { GET } from "./route";

const firstLink = config.links[0]!;
const mailtoLink = config.links.find((link) => link.url.startsWith("mailto:"))!;

let directory: string;
let logPath: string;

function request(slug: string) {
  return GET(new Request(`http://localhost:3000/go/${slug}`), { params: Promise.resolve({ slug }) });
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "linkfile-route-"));
  logPath = join(directory, "clicks.log");

  // Point the file store at a throwaway log so tests never touch the real .data.
  vi.stubEnv("CLICK_STORE", "file");
  vi.stubEnv("CLICK_LOG_PATH", logPath);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

describe("GET /go/[slug]", () => {
  it("redirects a configured slug to its destination", async () => {
    const response = await request(firstLink.slug);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(firstLink.url);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("passes mailto: destinations through untouched", async () => {
    const response = await request(mailtoLink.slug);

    expect(response.headers.get("Location")).toBe(mailtoLink.url);
  });

  it("records exactly one click, with only a slug and a timestamp", async () => {
    await request(firstLink.slug);

    const lines = (await readFile(logPath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);

    const recorded = JSON.parse(lines[0]!);
    expect(Object.keys(recorded).sort()).toEqual(["clickedAt", "slug"]);
    expect(recorded.slug).toBe(firstLink.slug);
    expect(new Date(recorded.clickedAt).toISOString()).toBe(recorded.clickedAt);
  });

  it.each(["nope", "GitHub", "../../etc/passwd", "", "go"])("returns 404 for the unknown slug %j", async (slug) => {
    const response = await request(slug);

    expect(response.status).toBe(404);
    expect(response.headers.get("Location")).toBeNull();
  });

  it("does not record a click for an unknown slug", async () => {
    await request("definitely-not-configured");

    await expect(readFile(logPath, "utf8")).rejects.toThrow(/ENOENT/);
  });

  it("ignores any redirect target supplied by the request", async () => {
    const response = await GET(new Request("http://localhost:3000/go/x?url=https://evil.example.com&to=//evil.test"), {
      params: Promise.resolve({ slug: firstLink.slug }),
    });

    expect(response.headers.get("Location")).toBe(firstLink.url);
  });

  it("still redirects when recording fails, and logs the failure once", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Create the log as a real file, then point the store at a path *underneath*
    // it. Creating that directory fails with ENOTDIR, so recording throws.
    await request(firstLink.slug);
    vi.stubEnv("CLICK_LOG_PATH", join(logPath, "impossible", "clicks.log"));

    const response = await request(firstLink.slug);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(firstLink.url);
    expect(error).toHaveBeenCalled();
    expect(String(error.mock.calls[0]?.[0])).toContain("Failed to record click");
  });

  it("still redirects when the click store is misconfigured", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("CLICK_STORE", "postgres");
    vi.stubEnv("DATABASE_URL", "");

    const response = await request(firstLink.slug);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(firstLink.url);
    expect(error).toHaveBeenCalled();
  });
});
