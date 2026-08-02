# Security Policy

## Reporting a vulnerability

Please report security issues privately through
[GitHub Security Advisories](https://github.com/erikkostashuk/linkfile/security/advisories/new) rather than opening a
public issue.

Include a description of the problem, the steps to reproduce it, and the affected version or commit. You can expect an
acknowledgement within a few days. Since Linkfile is self-hosted, fixes ship as a release and a patched `main` — you
control when you deploy them.

## Supported versions

Fixes land on `main`. There are no long-term support branches; please deploy from the latest commit or release.

## What Linkfile already does

Worth knowing before you report something, and worth preserving if you change this code.

**No open redirect.** `/go/<slug>` resolves destinations only from the validated `links.json`. Nothing from the request
— query string, headers, path — can influence the target. Unknown slugs return 404.

**Only safe destination protocols.** `https:`, `http:` and `mailto:` are accepted at configuration time; `javascript:`,
`data:`, `file:` and everything else fail the build.

**`/stats` is closed by default.** With `STATS_USERNAME` or `STATS_PASSWORD` unset or blank, the route returns 404 for
everyone. There is no default credential. Authorisation is checked twice — in `src/proxy.ts` and again inside the page —
so a bypassed or misconfigured proxy layer is not sufficient to expose data. Comparison is byte-wise without an early
exit, and authenticated responses are `no-store`.

**Credentials stay server-side.** `STATS_USERNAME` and `STATS_PASSWORD` have no `NEXT_PUBLIC_` prefix, so Next.js cannot
inline them into a browser bundle, and this project ships no client components at all.

**Minimal, parameterised data access.** The PostgreSQL store uses parameterised queries exclusively; the file store
writes `JSON.stringify` output and treats every log line as untrusted when reading.

**Security headers on every response.** A Content Security Policy restricted to `'self'`, plus `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and HSTS. There are no third-party scripts, fonts, images or
network calls to allow-list.

**Almost no attack surface from data.** The only data Linkfile stores is `{ slug, clickedAt }`, and slugs are matched
against a fixed allow-list from the configuration.

## Known limitations

These are deliberate trade-offs, not oversights. Please don't report them as vulnerabilities — but do open an issue if
you have a good idea for improving one.

- **Basic Auth over HTTPS only.** Credentials are sent on every `/stats` request. Terminate TLS in front of the app; all
  documented deployment paths do.
- **No rate limiting.** `/go/<slug>` is unauthenticated and can be hit repeatedly, which inflates click counts. Since no
  visitor data is stored, deduplication is not possible by design. Add rate limiting at your reverse proxy or CDN if
  inflated counts matter to you.
- **`'unsafe-inline'` in the CSP.** Next.js requires inline styles and bootstrap scripts. A nonce-based policy would
  mean running proxy middleware on every request for a page that ships no application JavaScript. The rest of the policy
  is locked to `'self'`, and no third-party origin is allowed.
- **Click log file permissions.** The file store inherits the permissions of the process that writes it. On a shared
  host, restrict `CLICK_LOG_PATH` accordingly; the provided systemd unit keeps it outside the app directory.

## Operator checklist

- [ ] Serve over HTTPS.
- [ ] Set a long, random `STATS_PASSWORD`, or leave both stats variables unset.
- [ ] Keep `.env` files out of version control — `.gitignore` already excludes them.
- [ ] On serverless hosts, use `DATABASE_URL` rather than assuming the file store persists.
- [ ] Back up `CLICK_LOG_PATH` or your database if the statistics matter.
- [ ] Run `npm audit` and keep dependencies current.
