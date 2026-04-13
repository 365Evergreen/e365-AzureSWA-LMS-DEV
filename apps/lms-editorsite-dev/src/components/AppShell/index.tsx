import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('editor.sidebarCollapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('editor.sidebarCollapsed', String(collapsed));
    } catch (e) {
      // ignore
    }
  }, [collapsed]);

  return (
    <div className={styles.shell}>
      <AppNav />
      <div className={`${styles.body} ${collapsed ? styles.bodyCollapsed : ''}`}>
        <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`} aria-label="Editor navigation">
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarEyebrow}>Workspace</span>
            <h2 className={styles.sidebarTitle}>Navigation</h2>
            <button
              aria-pressed={collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={styles.sidebarToggle}
              onClick={() => setCollapsed((s) => !s)}
            >
              {collapsed ? '▶' : '◀'}
            </button>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>{item.label.charAt(0)}</span>
                <span className={styles.navLabel}>{item.label}</span>
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
