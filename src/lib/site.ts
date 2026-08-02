export const DEFAULT_SITE_URL = "http://localhost:3000";

export type SiteUrlEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string | undefined;
  VERCEL_PROJECT_PRODUCTION_URL?: string | undefined;
};

export function normalizeSiteUrl(value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_SITE_URL;
  }

  try {
    const url = new URL(trimmed);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function resolveSiteUrl(env: SiteUrlEnvironment): string {
  if (env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL);
  }

  const vercelProductionDomain = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return normalizeSiteUrl(
    vercelProductionDomain ? `https://${vercelProductionDomain}` : undefined,
  );
}

export const siteUrl = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});

export const REPOSITORY_URL = "https://github.com/erikkostashuk/linkfile";
