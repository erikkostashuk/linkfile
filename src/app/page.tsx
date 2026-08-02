import Image from "next/image";

import { ArrowUpRight, LinkfileMark, LocationPin } from "@/components/icons";
import { config } from "@/lib/config";
import { REPOSITORY_URL, siteUrl } from "@/lib/site";

import styles from "./page.module.css";

const { profile, links, metadata } = config;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  alternateName: profile.handle,
  description: profile.bio,
  url: siteUrl,
  image: `${siteUrl}${profile.avatar}`,
  ...(profile.location
    ? {
        address: {
          "@type": "PostalAddress",
          addressLocality: profile.location,
        },
      }
    : {}),
  sameAs: links
    .filter((link) => link.url.startsWith("http"))
    .map((link) => link.url),
};

export default function ProfilePage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"

        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className={styles.shell}>
        <header className={styles.profile}>
          <div className={styles.avatarFrame}>
            <Image
              className={styles.avatar}
              src={profile.avatar}
              alt={`Portrait of ${profile.name}`}
              width={88}
              height={88}
              priority
            />
          </div>

          <div className={styles.identity}>
            <h1 className={styles.name}>{profile.name}</h1>
            <p className={styles.handle}>{profile.handle}</p>
          </div>

          <p className={styles.bio}>{profile.bio}</p>

          {profile.location ? (
            <p className={styles.location}>
              <LocationPin className={styles.locationIcon} />
              {profile.location}
            </p>
          ) : null}
        </header>

        <main className={styles.linkSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Explore</h2>
          </div>

          <ul className={styles.links}>
            {links.map((link, index) => (
              <li key={link.slug}>
                <a className={styles.link} href={`/go/${link.slug}`}>
                  {link.emoji ? (
                    <span className={styles.linkEmoji} aria-hidden="true">
                      {link.emoji}
                    </span>
                  ) : (
                    <span className={styles.linkIndex} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span className={styles.linkTitle}>{link.title}</span>
                  <span className={styles.arrowFrame} aria-hidden="true">
                    <ArrowUpRight className={styles.linkArrow} />
                  </span>
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
