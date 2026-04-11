import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useNav } from '../../hooks/useNav'
import type { NavNode } from '../../hooks/useNav'
import styles from './MegaNav.module.css'

interface MegaNavProps {
  /** Renders items vertically for the mobile drawer */
  mobile?: boolean
  onNavigate?: () => void
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DesktopItem({ item, onNavigate }: { item: NavNode; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (item.children.length === 0) {
    return (
      <li ref={ref} className={styles.item}>
        <NavLink
          to={item.href}
          end={item.href === '/'}
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
          }
          onClick={onNavigate}
        >
          {item.label}
        </NavLink>
      </li>
    )
  }

  return (
    <li ref={ref} className={styles.item}>
      <button
        type="button"
        className={`${styles.navButton} ${open ? styles.navButtonOpen : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className={styles.panel} role="region">
          <ul className={styles.panelList} role="list">
            {item.children.map((child) => (
              <li key={child.slug}>
                <NavLink
                  to={child.href}
                  className={({ isActive }) =>
                    isActive ? `${styles.panelLink} ${styles.panelLinkActive}` : styles.panelLink
                  }
                  onClick={() => { setOpen(false); onNavigate?.() }}
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

function MobileItem({ item, onNavigate }: { item: NavNode; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)

  if (item.children.length === 0) {
    return (
      <li>
        <NavLink
          to={item.href}
          end={item.href === '/'}
          className={({ isActive }) =>
            isActive ? `${styles.mobileLink} ${styles.mobileLinkActive}` : styles.mobileLink
          }
          onClick={onNavigate}
        >
          {item.label}
        </NavLink>
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        className={`${styles.mobileButton} ${open ? styles.mobileButtonOpen : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <ChevronDownIcon />
      </button>
      {open && (
        <ul className={styles.mobileChildren} role="list">
          {item.children.map((child) => (
            <li key={child.slug}>
              <NavLink
                to={child.href}
                className={({ isActive }) =>
                  isActive ? `${styles.mobileChildLink} ${styles.mobileLinkActive}` : styles.mobileChildLink
                }
                onClick={onNavigate}
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function MegaNav({ mobile = false, onNavigate }: MegaNavProps) {
  const { items } = useNav()

  if (mobile) {
    return (
      <ul className={styles.mobileNav} role="list">
        {items.map((item) => (
          <MobileItem key={item.slug} item={item} onNavigate={onNavigate} />
        ))}
      </ul>
    )
  }

  return (
    <ul className={styles.nav} role="list">
      {items.map((item) => (
        <DesktopItem key={item.slug} item={item} onNavigate={onNavigate} />
      ))}
    </ul>
  )
}
