import { NavLink, Outlet } from 'react-router-dom';
import AppNav from '../AppNav';
import styles from './AppShell.module.css';

interface NavItemConfig {
  to: string;
  label: string;
  end?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/knowledge-base', label: 'Knowledge Base' },
  { to: '/website', label: 'Website' },
  { to: '/blog-posts', label: 'Blog Posts' },
  { to: '/media', label: 'Media Library' },
];

export default function AppShell() {
  return (
    <div className={styles.shell}>
      <AppNav />
      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Editor navigation">
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarEyebrow}>Workspace</span>
            <h2 className={styles.sidebarTitle}>Navigation</h2>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
