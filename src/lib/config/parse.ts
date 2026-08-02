import { z } from "zod";

import { linkfileConfigSchema, type LinkfileConfig } from "./schema";

export class LinkfileConfigError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[], source: string) {
    super(
      [
        `Invalid Linkfile configuration in ${source}:`,
        "",
        ...issues.map((issue) => `  • ${issue}`),
        "",
        "Fix the file and save — the schema is documented in links.schema.json.",
      ].join("\n"),
    );
    this.name = "LinkfileConfigError";
    this.issues = issues;
  }
}

export function formatIssuePath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) {
    return "(root)";
  }

  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment}]`;
    }
    return acc === "" ? String(segment) : `${acc}.${String(segment)}`;
  }, "");
}

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${formatIssuePath(issue.path)}: ${issue.message}`,
  );
}

export function parseConfig(
  input: unknown,
  source = "links.json",
): LinkfileConfig {
  const result = linkfileConfigSchema.safeParse(input);

  if (!result.success) {
    throw new LinkfileConfigError(formatIssues(result.error), source);
  }

  return result.data;
}
