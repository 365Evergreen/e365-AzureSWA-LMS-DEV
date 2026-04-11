import type { ReactNode } from 'react'
import { SiteNav } from '../SiteNav'
import { SiteFooter } from '../SiteFooter'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <SiteNav />
      <main className={styles.main}>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
