import type { ReactNode } from 'react';
import styles from './ContentLayout.module.css';

export type ContentLayoutVariant = 'fse' | 'left-sidebar' | 'right-sidebar';

export interface ContentLayoutProps {
  children: ReactNode;
  variant?: ContentLayoutVariant;
  sidebar?: ReactNode;
}

export function ContentLayout({ children, variant = 'fse', sidebar }: ContentLayoutProps) {
  if (variant === 'left-sidebar') {
    return (
      <div className={`${styles.root} ${styles.withSidebar}`}>
        <aside className={styles.sidebar}>{sidebar ?? <div className={styles.sidebarEmpty}>Sidebar</div>}</aside>
        <main className={styles.main}>{children}</main>
      </div>
    );
  }

  if (variant === 'right-sidebar') {
    return (
      <div className={`${styles.root} ${styles.withSidebar}`}>
        <main className={styles.main}>{children}</main>
        <aside className={styles.sidebar}>{sidebar ?? <div className={styles.sidebarEmpty}>Sidebar</div>}</aside>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
