import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MegaNav } from '../MegaNav'
import styles from './SiteHeader.module.css'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logoLink} aria-label="LMS Platform home">
          <span className={styles.logoMark} aria-hidden="true">LMS</span>
          <span className={styles.logoText}>LMS Platform</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Main navigation">
          <MegaNav onNavigate={closeMenu} />
        </nav>

        <div className={styles.actions}>
          <Link to="/kb" className={styles.ctaButton}>
            Get Started
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
        <Link to="/kb" className={styles.mobileCtaButton} onClick={closeMenu}>
          Get Started
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
