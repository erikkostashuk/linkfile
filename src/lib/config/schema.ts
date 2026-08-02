import { z } from "zod";

/**
 * Protocols a link destination is allowed to use.
 *
 * Everything else — most importantly `javascript:` and `data:` — is rejected at
 * configuration time so an unsafe destination can never reach the redirect
 * handler or the rendered page.
 */
export const ALLOWED_PROTOCOLS = ["https:", "http:", "mailto:"] as const;

/** Matches `#rgb`, `#rrggbb` and `#rrggbbaa`. */
const HEX_COLOUR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Lowercase, hyphen-separated identifiers such as `open-source`. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Avatar must be a root-relative path served from `/public`. */
const PUBLIC_PATH = /^\/[^\s]*$/;

const trimmed = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, { error: `${label} must not be empty` })
    .max(max, { error: `${label} must be ${max} characters or fewer` });

const destinationUrl = z
  .string({ error: "url is required" })
  .trim()
  .min(1, { error: "url must not be empty" })
  .superRefine((value, ctx) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: `"${value}" is not an absolute URL. Use a full destination such as https://example.com/page or mailto:you@example.com`,
      });
      return;
    }

    if (!(ALLOWED_PROTOCOLS as readonly string[]).includes(parsed.protocol)) {
      ctx.addIssue({
        code: "custom",
        message: `protocol "${parsed.protocol}" is not allowed. Use one of: ${ALLOWED_PROTOCOLS.join(", ")}`,
      });
    }
  });

export const linkSchema = z.strictObject({
  slug: z
    .string({ error: "slug is required" })
    .trim()
    .min(1, { error: "slug must not be empty" })
    .max(64, { error: "slug must be 64 characters or fewer" })
    .regex(SLUG, {
      error: "slug may only contain lowercase letters, numbers and single hyphens (for example: my-newsletter)",
    }),
  title: trimmed("title", 80),
  url: destinationUrl,
  emoji: z
    .string()
    .trim()
    .min(1, { error: "emoji must not be empty when present" })
    .max(8, { error: "emoji must be 8 characters or fewer" })
    .optional(),
});

export const profileSchema = z.strictObject({
  name: trimmed("profile.name", 80),
  handle: trimmed("profile.handle", 40),
  bio: trimmed("profile.bio", 280),
  avatar: trimmed("profile.avatar", 200).regex(PUBLIC_PATH, {
    error: 'profile.avatar must be a path inside /public, for example "/avatar.svg"',
  }),
  location: trimmed("profile.location", 60).optional(),
  accent: z
    .string()
    .trim()
    .regex(HEX_COLOUR, {
      error: 'profile.accent must be a hex colour such as "#1d4ed8"',
    })
    .optional(),
  showBranding: z.boolean().optional().default(true),
});

export const metadataSchema = z.strictObject({
  title: trimmed("metadata.title", 120),
  description: trimmed("metadata.description", 200),
});

export const linkfileConfigSchema = z
  .strictObject({
    // Present so editors can resolve links.schema.json. Ignored at runtime.
    $schema: z.string().optional(),
    profile: profileSchema,
    metadata: metadataSchema,
    links: z
      .array(linkSchema)
      .min(1, { error: "links must contain at least one link" })
      .superRefine((links, ctx) => {
        const seen = new Map<string, number>();

        links.forEach((link, index) => {
          const firstIndex = seen.get(link.slug);

          if (firstIndex === undefined) {
            seen.set(link.slug, index);
            return;
          }

          ctx.addIssue({
            code: "custom",
            path: [index, "slug"],
            message: `duplicate slug "${link.slug}" — already used by links[${firstIndex}]. Every slug must be unique because it identifies the link in /go/<slug> and in click statistics.`,
          });
        });
      }),
  })
  .transform(({ $schema: _schema, ...config }) => config);

export type LinkfileConfig = z.infer<typeof linkfileConfigSchema>;
export type LinkfileLink = LinkfileConfig["links"][number];
export type LinkfileProfile = LinkfileConfig["profile"];
