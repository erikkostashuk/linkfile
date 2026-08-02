import { describe, expect, it } from "vitest";

import realConfig from "~/links.json";

import { LinkfileConfigError, formatIssuePath, parseConfig } from "./parse";

/** A minimal configuration that every test mutates into the shape it needs. */
function validConfig() {
  return {
    profile: {
      name: "Alex Rivera",
      handle: "@alexbuilds",
      bio: "Backend engineer.",
      avatar: "/avatar.svg",
      location: "Toronto, Canada",
      accent: "#7c3aed",
      showBranding: true,
    },
    metadata: {
      title: "Alex Rivera — Software Engineer",
      description: "Projects, writing and ways to get in touch.",
    },
    links: [
      { slug: "projects", title: "Projects", url: "https://example.com/projects", emoji: "🚀" },
      { slug: "contact", title: "Email me", url: "mailto:hello@example.com" },
    ],
  };
}

function expectIssues(input: unknown): readonly string[] {
  try {
    parseConfig(input);
  } catch (error) {
    expect(error).toBeInstanceOf(LinkfileConfigError);
    return (error as LinkfileConfigError).issues;
  }

  throw new Error("Expected parseConfig to reject this configuration, but it was accepted.");
}

describe("parseConfig — valid configuration", () => {
  it("accepts a complete configuration and preserves link order", () => {
    const parsed = parseConfig(validConfig());

    expect(parsed.profile.name).toBe("Alex Rivera");
    expect(parsed.links.map((link) => link.slug)).toEqual(["projects", "contact"]);
  });

  it("defaults showBranding to true and leaves optional fields undefined", () => {
    const input = validConfig();
    delete (input.profile as Partial<ReturnType<typeof validConfig>["profile"]>).showBranding;
    delete (input.profile as Partial<ReturnType<typeof validConfig>["profile"]>).location;
    delete (input.profile as Partial<ReturnType<typeof validConfig>["profile"]>).accent;

    const parsed = parseConfig(input);

    expect(parsed.profile.showBranding).toBe(true);
    expect(parsed.profile.location).toBeUndefined();
    expect(parsed.profile.accent).toBeUndefined();
  });

  it("strips the $schema pointer used by editors", () => {
    const parsed = parseConfig({ $schema: "./links.schema.json", ...validConfig() });

    expect(parsed).not.toHaveProperty("$schema");
  });

  it("validates the links.json shipped with the repository", () => {
    const parsed = parseConfig(realConfig);

    expect(parsed.links.length).toBeGreaterThan(0);
    expect(parsed.profile.avatar.startsWith("/")).toBe(true);
  });

  it("accepts https, http and mailto destinations", () => {
    const input = validConfig();
    input.links = [
      { slug: "secure", title: "Secure", url: "https://example.com", emoji: "🔒" },
      { slug: "plain", title: "Plain", url: "http://example.com", emoji: "📄" },
      { slug: "mail", title: "Mail", url: "mailto:hello@example.com", emoji: "✉️" },
    ];

    expect(parseConfig(input).links).toHaveLength(3);
  });
});

describe("parseConfig — link rules", () => {
  it("rejects duplicate slugs and names the conflicting entry", () => {
    const input = validConfig();
    input.links = [
      { slug: "projects", title: "Projects", url: "https://example.com/a", emoji: "🚀" },
      { slug: "projects", title: "Also projects", url: "https://example.com/b", emoji: "🚀" },
    ];

    const issues = expectIssues(input);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("links[1].slug");
    expect(issues[0]).toContain('duplicate slug "projects"');
    expect(issues[0]).toContain("links[0]");
  });

  it.each([
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="],
    ["file:", "file:///etc/passwd"],
    ["ftp:", "ftp://example.com/file.txt"],
  ])("rejects the unsafe %s protocol", (protocol, url) => {
    const input = validConfig();
    input.links = [{ slug: "unsafe", title: "Unsafe", url, emoji: "⚠️" }];

    const issues = expectIssues(input);

    expect(issues[0]).toContain("links[0].url");
    expect(issues[0]).toContain(`protocol "${protocol}" is not allowed`);
  });

  it("rejects relative URLs", () => {
    const input = validConfig();
    input.links = [{ slug: "relative", title: "Relative", url: "/somewhere", emoji: "➡️" }];

    expect(expectIssues(input)[0]).toContain("is not an absolute URL");
  });

  it("rejects an empty title", () => {
    const input = validConfig();
    input.links = [{ slug: "blank", title: "   ", url: "https://example.com", emoji: "❓" }];

    const issues = expectIssues(input);

    expect(issues[0]).toContain("links[0].title");
    expect(issues[0]).toContain("must not be empty");
  });

  it.each(["Projects", "my_link", "double--hyphen", "-leading", "trailing-", "with space"])(
    "rejects the malformed slug %j",
    (slug) => {
      const input = validConfig();
      input.links = [{ slug, title: "Link", url: "https://example.com", emoji: "🔗" }];

      expect(expectIssues(input)[0]).toContain("links[0].slug");
    },
  );

  it("rejects unknown link properties so typos are caught rather than ignored", () => {
    const input = validConfig();
    input.links = [
      { slug: "typo", title: "Link", url: "https://example.com", icon: "🔗" } as unknown as (typeof input.links)[number],
    ];

    const issues = expectIssues(input);

    expect(issues[0]).toContain("links[0]");
    expect(issues[0]).toContain('Unrecognized key: "icon"');
  });

  it("rejects an empty links array", () => {
    const input = validConfig();
    input.links = [];

    expect(expectIssues(input)[0]).toContain("at least one link");
  });
});

describe("parseConfig — profile rules", () => {
  it.each(["7c3aed", "#12345", "rgb(0,0,0)", "purple", "#ggghhh"])("rejects the invalid accent %j", (accent) => {
    const input = validConfig();
    input.profile.accent = accent;

    expect(expectIssues(input)[0]).toContain("profile.accent");
  });

  it.each(["#fff", "#7c3aed", "#7C3AEDCC"])("accepts the valid accent %j", (accent) => {
    const input = validConfig();
    input.profile.accent = accent;

    expect(parseConfig(input).profile.accent).toBe(accent);
  });

  it.each(["name", "handle", "bio", "avatar"] as const)("rejects a missing profile.%s", (field) => {
    const input = validConfig();
    delete (input.profile as Record<string, unknown>)[field];

    expect(expectIssues(input)[0]).toContain(`profile.${field}`);
  });

  it("rejects an avatar that is not a public path", () => {
    const input = validConfig();
    input.profile.avatar = "https://cdn.example.com/me.png";

    expect(expectIssues(input)[0]).toContain("profile.avatar");
  });

  it("rejects missing metadata", () => {
    const input = validConfig();
    delete (input as Partial<ReturnType<typeof validConfig>>).metadata;

    expect(expectIssues(input)[0]).toContain("metadata");
  });

  it("reports every problem at once instead of stopping at the first", () => {
    const issues = expectIssues({
      profile: { name: "", handle: "", bio: "", avatar: "nope" },
      metadata: { title: "", description: "" },
      links: [{ slug: "BAD", title: "", url: "javascript:alert(1)" }],
    });

    expect(issues.length).toBeGreaterThan(5);
  });

  it("rejects input that is not an object", () => {
    expect(expectIssues("not a config")).toHaveLength(1);
    expect(expectIssues(null)).toHaveLength(1);
  });
});

describe("LinkfileConfigError", () => {
  it("names the source file and lists every issue in its message", () => {
    const error = new LinkfileConfigError(["links[0].url: bad protocol"], "links.json");

    expect(error.message).toContain("links.json");
    expect(error.message).toContain("links[0].url: bad protocol");
    expect(error.name).toBe("LinkfileConfigError");
  });
});

describe("formatIssuePath", () => {
  it.each([
    [[], "(root)"],
    [["profile", "name"], "profile.name"],
    [["links", 2, "url"], "links[2].url"],
    [[0, "slug"], "[0].slug"],
  ])("formats %j as %j", (path, expected) => {
    expect(formatIssuePath(path)).toBe(expected);
  });
});
