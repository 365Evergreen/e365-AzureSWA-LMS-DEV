import type { ReactNode } from 'react';
import styles from './LandingLayout.module.css';

export interface LandingLayoutProps {
  children: ReactNode;
  contentWidth?: string;
}

export function LandingLayout({ children, contentWidth }: LandingLayoutProps) {
  return (
    <div className={styles.root} style={contentWidth ? { maxWidth: contentWidth } : undefined}>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
