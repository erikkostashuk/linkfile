import Link from "next/link";
import type { Metadata } from "next";

import { LinkfileMark } from "@/components/icons";

import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className={styles.page}>
      <p className={styles.code}>
        <LinkfileMark className={styles.mark} />
        404
      </p>
      <h1 className={styles.title}>This link doesn&rsquo;t exist</h1>
      <p className={styles.body}>
        It may have been renamed or removed from <code>links.json</code>.
      </p>
      <Link className={styles.action} href="/">
        Back to the profile
      </Link>
    </div>
  );
}
