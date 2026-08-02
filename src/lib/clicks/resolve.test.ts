import { describe, expect, it } from "vitest";

import { resolveClickStore } from "./resolve";
import { ClickStoreConfigError } from "./types";

const DATABASE_URL = "postgres://db.example.com:5432/linkfile";

describe("resolveClickStore — auto", () => {
  it("uses the file store on an ordinary Node host with no database", () => {
    expect(resolveClickStore({})).toEqual({
      kind: "file",
      mode: "auto",
      logPath: ".data/clicks.log",
    });
  });

  it("honours CLICK_LOG_PATH", () => {
    expect(
      resolveClickStore({ CLICK_LOG_PATH: "/var/lib/linkfile/clicks.log" }),
    ).toMatchObject({
      kind: "file",
      logPath: "/var/lib/linkfile/clicks.log",
    });
  });

  it("prefers PostgreSQL as soon as DATABASE_URL is present", () => {
    expect(resolveClickStore({ DATABASE_URL })).toEqual({
      kind: "postgres",
      mode: "auto",
      connectionString: DATABASE_URL,
    });
  });

  it("disables recording on a serverless host with no database", () => {
    const resolution = resolveClickStore({ VERCEL: "1" });

    expect(resolution.kind).toBe("disabled");
    expect(resolution.kind === "disabled" && resolution.reason).toContain(
      "DATABASE_URL",
    );
  });

  it("detects a serverless host from VERCEL_ENV alone", () => {
    expect(resolveClickStore({ VERCEL_ENV: "production" }).kind).toBe(
      "disabled",
    );
  });

  it("uses PostgreSQL on a serverless host once DATABASE_URL is set", () => {
    expect(resolveClickStore({ VERCEL: "1", DATABASE_URL }).kind).toBe(
      "postgres",
    );
  });

  it("treats an empty or whitespace CLICK_STORE as auto", () => {
    expect(resolveClickStore({ CLICK_STORE: "" }).mode).toBe("auto");
    expect(resolveClickStore({ CLICK_STORE: "   " }).mode).toBe("auto");
  });
});

describe("resolveClickStore — file", () => {
  it("forces the file store even when a database is configured", () => {
    expect(resolveClickStore({ CLICK_STORE: "file", DATABASE_URL })).toEqual({
      kind: "file",
      mode: "file",
      logPath: ".data/clicks.log",
    });
  });

  it("forces the file store even on a serverless host", () => {
    expect(resolveClickStore({ CLICK_STORE: "file", VERCEL: "1" }).kind).toBe(
      "file",
    );
  });
});

describe("resolveClickStore — postgres", () => {
  it("uses the configured connection string", () => {
    expect(
      resolveClickStore({ CLICK_STORE: "postgres", DATABASE_URL }),
    ).toEqual({
      kind: "postgres",
      mode: "postgres",
      connectionString: DATABASE_URL,
    });
  });

  it("fails loudly rather than silently falling back when DATABASE_URL is missing", () => {
    expect(() => resolveClickStore({ CLICK_STORE: "postgres" })).toThrow(
      ClickStoreConfigError,
    );
    expect(() => resolveClickStore({ CLICK_STORE: "postgres" })).toThrow(
      /requires DATABASE_URL/,
    );
  });

  it("treats a blank DATABASE_URL as missing", () => {
    expect(() =>
      resolveClickStore({ CLICK_STORE: "postgres", DATABASE_URL: "  " }),
    ).toThrow(ClickStoreConfigError);
  });
});

describe("resolveClickStore — invalid input", () => {
  it.each(["sqlite", "postgresql", "pg", "redis", "none"])(
    "rejects CLICK_STORE=%j",
    (value) => {
      expect(() => resolveClickStore({ CLICK_STORE: value })).toThrow(
        ClickStoreConfigError,
      );
    },
  );

  it("accepts modes case-insensitively", () => {
    expect(resolveClickStore({ CLICK_STORE: "FILE" }).mode).toBe("file");
    expect(resolveClickStore({ CLICK_STORE: " Auto " }).mode).toBe("auto");
  });

  it("names the valid options in the error message", () => {
    expect(() => resolveClickStore({ CLICK_STORE: "sqlite" })).toThrow(
      /auto, file, postgres/,
    );
  });
});
