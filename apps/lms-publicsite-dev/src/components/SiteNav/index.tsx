import { Nav } from '@lms/shared-ui'
import type { NavItem } from '@lms/shared-ui'
import styles from './SiteNav.module.css'

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Knowledge Base', href: '/kb' },
]

export function SiteNav() {
  return (
    <Nav
      logo={<span className={styles.logo}>LMS Platform</span>}
      items={NAV_ITEMS}
    />
  )
}