import { describe, expect, it } from "vitest";

import {
  authorizeStatsRequest,
  getStatsCredentials,
  parseBasicAuthHeader,
  timingSafeEqual,
} from "./auth";

function basic(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  return `Basic ${btoa(String.fromCharCode(...bytes))}`;
}

const configured = {
  STATS_USERNAME: "owner",
  STATS_PASSWORD: "correct horse battery staple",
};

describe("parseBasicAuthHeader", () => {
  it("decodes a well-formed header", () => {
    expect(parseBasicAuthHeader(basic("owner", "s3cret"))).toEqual({
      username: "owner",
      password: "s3cret",
    });
  });

  it("is case-insensitive about the scheme name", () => {
    expect(
      parseBasicAuthHeader(basic("owner", "s3cret").replace("Basic", "basic"))
        ?.username,
    ).toBe("owner");
  });

  it("keeps colons in the password, splitting only on the first one", () => {
    expect(parseBasicAuthHeader(basic("owner", "a:b:c"))?.password).toBe(
      "a:b:c",
    );
  });

  it("accepts an empty password", () => {
    expect(parseBasicAuthHeader(basic("owner", ""))).toEqual({
      username: "owner",
      password: "",
    });
  });

  it("decodes non-ASCII credentials as UTF-8", () => {
    expect(parseBasicAuthHeader(basic("møller", "pässwörd"))).toEqual({
      username: "møller",
      password: "pässwörd",
    });
  });

  it.each([
    ["a missing header", undefined],
    ["a null header", null],
    ["an empty header", ""],
    ["a bearer token", "Bearer abc123"],
    ["a digest challenge", "Digest username=owner"],
    ["base64 with no colon separator", `Basic ${btoa("ownerpassword")}`],
    ["invalid base64", "Basic !!!not-base64!!!"],
    ["a scheme with no payload", "Basic"],
  ])("returns null for %s", (_label, header) => {
    expect(parseBasicAuthHeader(header)).toBeNull();
  });
});

describe("timingSafeEqual", () => {
  it("matches identical strings", () => {
    expect(timingSafeEqual("hunter2", "hunter2")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it.each([
    ["hunter2", "hunter3"],
    ["hunter2", "hunter"],
    ["", "a"],
    ["Hunter2", "hunter2"],
  ])("rejects %j vs %j", (a, b) => {
    expect(timingSafeEqual(a, b)).toBe(false);
  });
});

describe("getStatsCredentials", () => {
  it("returns the configured pair", () => {
    expect(getStatsCredentials(configured)).toEqual({
      username: "owner",
      password: "correct horse battery staple",
    });
  });

  it.each([
    ["nothing is set", {}],
    ["only the username is set", { STATS_USERNAME: "owner" }],
    ["only the password is set", { STATS_PASSWORD: "s3cret" }],
    [
      "the username is blank",
      { STATS_USERNAME: "   ", STATS_PASSWORD: "s3cret" },
    ],
    ["the password is blank", { STATS_USERNAME: "owner", STATS_PASSWORD: "" }],
  ])("returns null when %s", (_label, env) => {
    expect(getStatsCredentials(env)).toBeNull();
  });
});

describe("authorizeStatsRequest", () => {
  it("authorizes matching credentials", () => {
    const header = basic("owner", "correct horse battery staple");

    expect(authorizeStatsRequest(header, configured)).toEqual({
      status: "authorized",
    });
  });

  it("reports not-configured when no credentials are set, even with a valid-looking header", () => {
    expect(authorizeStatsRequest(basic("owner", "anything"), {})).toEqual({
      status: "not-configured",
    });
  });

  it("rejects a wrong password", () => {
    expect(authorizeStatsRequest(basic("owner", "wrong"), configured)).toEqual({
      status: "unauthorized",
    });
  });

  it("rejects a wrong username", () => {
    expect(
      authorizeStatsRequest(
        basic("intruder", "correct horse battery staple"),
        configured,
      ),
    ).toEqual({
      status: "unauthorized",
    });
  });

  it("rejects a request with no Authorization header", () => {
    expect(authorizeStatsRequest(null, configured)).toEqual({
      status: "unauthorized",
    });
  });

  it("rejects a malformed header", () => {
    expect(authorizeStatsRequest("Basic not-base64!", configured)).toEqual({
      status: "unauthorized",
    });
  });

  it("does not treat an empty configured password as a wildcard", () => {
    expect(
      authorizeStatsRequest(basic("owner", ""), {
        STATS_USERNAME: "owner",
        STATS_PASSWORD: "",
      }),
    ).toEqual({
      status: "not-configured",
    });
  });
});
