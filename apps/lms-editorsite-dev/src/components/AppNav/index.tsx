import { Link } from 'react-router-dom';
import { Nav, Button } from '@lms/shared-ui';
import { useAuth, logout } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import styles from './AppNav.module.css';

export default function AppNav() {
  const { user } = useAuth(msalInstance);

  function handleSignOut() {
    logout(msalInstance);
  }

  return (
    <Nav
      logo={
        <Link to="/" className={styles.logoLink}>
          <img
            src="https://stlms365evdev.blob.core.windows.net/media/Evergreen_Logo__100px.png"
            alt="Evergreen LMS"
            className={styles.logoImage}
          />
          <span className={styles.logoTitle}>365 Evergreen LMS admin portal</span>
        </Link>
      }
      items={
        user
          ? [
              { label: 'Courses', href: '/courses' },
              { label: 'Knowledge Base', href: '/knowledge-base' },
              { label: 'Website', href: '/website' },
              { label: 'Blog Posts', href: '/blog-posts' },
              { label: 'Media', href: '/media' },
            ]
          : []
      }
      actions={
        <div className={styles.actions}>
          {user ? (
            <>
              <span className={styles.displayName}>
                {user.account.name ?? user.account.username}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      }
    />
  );
}
