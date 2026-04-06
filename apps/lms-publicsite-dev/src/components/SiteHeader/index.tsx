import { useState, useCallback } from 'react'
import { NavLink, Link } from 'react-router-dom'
import styles from './SiteHeader.module.css'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Blog', href: '/blog' },
  { label: 'Knowledge Base', href: '/kb' },
]

function getNavLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? `${styles.navLink} ${styles.navLinkActive}`
    : styles.navLink
}

function getMobileNavLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? `${styles.mobileNavLink} ${styles.mobileNavLinkActive}`
    : styles.mobileNavLink
}

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

        <ul className={styles.nav} role="list">
          {NAV_ITEMS.map(({ label, href }) => (
            <li key={href}>
              <NavLink
                to={href}
                end={href === '/'}
                className={getNavLinkClass}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

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
        {NAV_ITEMS.map(({ label, href }) => (
          <NavLink
            key={href}
            to={href}
            end={href === '/'}
            className={getMobileNavLinkClass}
            onClick={closeMenu}
          >
            {label}
          </NavLink>
        ))}
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
