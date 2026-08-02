# Contributing to Linkfile

Thanks for taking a look. Bug reports, documentation fixes and focused improvements are all welcome.

## Getting set up

```bash
git clone https://github.com/erikkostashuk/linkfile
cd linkfile
npm install
cp .env.example .env.local
npm run dev
```

Before opening a pull request:

```bash
npm run check   # lint + typecheck + tests
npm run build
```

CI runs exactly these two commands on Node 22. Please fix failures rather than working around them — no new ESLint
disables, `@ts-expect-error`s, or skipped tests without a comment explaining why.

## What Linkfile is trying to be

Understanding the constraints will save you a rejected PR:

- **One JSON file is the entire CMS.** No admin UI, no content database, no per-user accounts. If a feature needs a
  dashboard, it belongs in a different project.
- **The dependency list stays short.** No Tailwind, no component library, no ORM, no state library, no analytics SDK.
  A new runtime dependency needs to justify itself against writing ~50 lines instead.
- **A click is two fields.** `{ slug, clickedAt }` — nothing else. Not IPs, not user agents, not referrers, not
  "anonymised" hashes of any of those. This is the product's core promise; PRs that widen it will be declined.
- **The profile page ships no application JavaScript.** Server Components and plain CSS only. If an idea requires
  hydration, look for a CSS or server-side version first.
- **Redirects never depend on analytics.** Any change to `/go/[slug]` must keep the redirect working when recording
  fails.

## Good first contributions

- Documentation clarifications, especially around self-hosting.
- Accessibility improvements — contrast, focus order, screen reader labels.
- Additional reverse-proxy or platform examples in `deploy/`.
- Tests for edge cases in configuration validation or click aggregation.

## Adding a click store

The storage seam is `ClickStore` in `src/lib/clicks/types.ts`. A new backend means:

1. A new file exporting `createXClickStore(...): ClickStore`.
2. A branch in `resolveClickStore` (`src/lib/clicks/resolve.ts`) plus tests for every environment combination.
3. A lazy `await import()` in `getClickStore` so the driver is not loaded by deployments that don't use it.
4. A row in the README's storage table.

Keep the interface unchanged if you can — routes and pages must not need to know which backend is active.

## Code style

- TypeScript strict mode; no `any`, and prefer narrow types over casts.
- Comments explain *why*, not *what*. If a line needs a "what" comment, the line probably wants rewriting.
- Match the surrounding formatting. There is no Prettier hook, so keep diffs tidy by hand.
- Small, focused commits with a clear message. One concern per pull request.

## Reporting bugs

Include: what you expected, what happened, your `CLICK_STORE` setting and deployment target (Vercel / Docker / VPS), and
the output of `curl -s localhost:3000/api/health`. Please redact any real credentials.

Security issues go to [SECURITY.md](SECURITY.md), not the public issue tracker.
