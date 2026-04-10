import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>365 Evergreen LMS</span>
        <nav className={styles.links} aria-label="Footer navigation">
          <a href="/catalogue" className={styles.link}>Catalogue</a>
          <a href="mailto:support@365evergreen.com.au" className={styles.link}>Support</a>
        </nav>
        <span className={styles.copy}>&copy; {year} 365 Evergreen. All rights reserved.</span>
      </div>
    </footer>
  );
}
