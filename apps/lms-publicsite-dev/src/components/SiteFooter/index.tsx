import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} LMS Platform. All rights reserved.
        </p>
        <nav className={styles.links} aria-label="Footer navigation">
          <a href="/catalogue" className={styles.link}>Courses</a>
          <a href="/request-access" className={styles.link}>Request access</a>
          <a href="/blog" className={styles.link}>Blog</a>
          <a href="/kb" className={styles.link}>Knowledge Base</a>
        </nav>
      </div>
    </footer>
  )
}