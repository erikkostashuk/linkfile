import { ArrowUpRight, LinkfileMark, LocationPin } from "@/components/icons";
import { config } from "@/lib/config";
import { REPOSITORY_URL, siteUrl } from "@/lib/site";

import styles from "./page.module.css";

const { profile, links, metadata } = config;

/**
 * schema.org Person data, so search engines and rich-result previews understand
 * the page is a profile rather than an unstructured list of links.
 */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  alternateName: profile.handle,
  description: profile.bio,
  url: siteUrl,
  image: `${siteUrl}${profile.avatar}`,
  ...(profile.location ? { address: { "@type": "PostalAddress", addressLocality: profile.location } } : {}),
  sameAs: links.filter((link) => link.url.startsWith("http")).map((link) => link.url),
};

export default function ProfilePage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        // Serialised server-side from validated configuration; no user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className={styles.shell}>
        <header className={styles.profile}>
          <div className={styles.avatarFrame}>
            {/*
              A plain <img> with explicit dimensions: the avatar is a small local
              asset, so next/image would add client JavaScript for no benefit.
              Fixed width/height reserve the space and prevent layout shift.
            */}
            <img
              className={styles.avatar}
              src={profile.avatar}
              alt={`Portrait of ${profile.name}`}
              width={80}
              height={80}
              decoding="async"
            />
          </div>

          <h1 className={styles.name}>{profile.name}</h1>

          <p className={styles.handle}>
            <span className={styles.handleDot} aria-hidden="true" />
            {profile.handle}
          </p>

          <p className={styles.bio}>{profile.bio}</p>

          {profile.location ? (
            <p className={styles.location}>
              <LocationPin className={styles.locationIcon} />
              {profile.location}
            </p>
          ) : null}
        </header>

        <main>
          <h2 className="visually-hidden">Links</h2>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.slug}>
                <a className={styles.link} href={`/go/${link.slug}`}>
                  {link.emoji ? (
                    <span className={styles.linkEmoji} aria-hidden="true">
                      {link.emoji}
                    </span>
                  ) : null}
                  <span className={styles.linkTitle}>{link.title}</span>
                  <ArrowUpRight className={styles.linkArrow} />
                </a>
              </li>
            ))}
          </ul>
        </main>

        {profile.showBranding ? (
          <footer className={styles.footer}>
            <a
              className={styles.branding}
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={`${metadata.title} — built with Linkfile`}
            >
              <LinkfileMark className={styles.brandingMark} />
              Built with Linkfile
            </a>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
