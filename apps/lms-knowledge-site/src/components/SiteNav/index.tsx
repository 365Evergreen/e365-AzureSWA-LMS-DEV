import { Nav } from '@lms/shared-ui'
import styles from './SiteNav.module.css'

export function SiteNav() {
  const logo = <span className={styles.logo}>Knowledge Base</span>
  return <Nav logo={logo} items={[{ label: 'Articles', href: '/articles' }]} />
}
