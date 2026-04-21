import type { ReactNode } from 'react';
import styles from './Nav.module.css';

export interface NavItem {
  label: string;
  href: string;
}

export interface NavProps {
  logo?: ReactNode;
  items: NavItem[];
  actions?: ReactNode;
}

export function Nav({ logo, items, actions }: NavProps) {
  return (
    <nav className={styles.nav}>
      {logo && <div className={styles.logo}>{logo}</div>}
      {items.length > 0 && (
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={styles.link}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </nav>
  );
}
