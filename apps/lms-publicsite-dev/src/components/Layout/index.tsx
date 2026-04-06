import type { ReactNode } from 'react'
import { SiteHeader } from '../SiteHeader'
import { SiteFooter } from '../SiteFooter'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.wrapper}>
      <SiteHeader />
      <main className={styles.main}>{children}</main>
      <SiteFooter />
    </div>
  )
}