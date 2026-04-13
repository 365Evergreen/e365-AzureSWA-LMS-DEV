import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MegaNav } from '../MegaNav'
import styles from './SiteHeader.module.css'

const SITE_LOGO_URL = 'https://stlms365evdev.blob.core.windows.net/media/87ff47c3-963a-40cf-93a1-761e699efa95-Evergreen_Logo__100px.webp'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logoLink} aria-label="LMS Platform home">
          <img src={SITE_LOGO_URL} alt="" className={styles.logoImage} />
          <span className={styles.logoText}>Stay Evergreen</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Main navigation">
          <MegaNav onNavigate={closeMenu} />
        </nav>

        <div className={styles.actions}>
          <Link to="/sign-up" className={styles.ctaButton}>
            Get started
          </Link>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={toggleMenu}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Mobile navigation"
        className={menuOpen ? `${styles.mobileMenu} ${styles.mobileMenuOpen}` : styles.mobileMenu}
      >
        <MegaNav mobile onNavigate={closeMenu} />
        <Link to="/sign-up" className={styles.mobileCtaButton} onClick={closeMenu}>
          Get started
        </Link>
      </nav>
    </header>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
