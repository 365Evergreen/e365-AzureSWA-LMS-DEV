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
      logo={<span className={styles.logo}>LMS Editor</span>}
      items={
        user
          ? [
              { label: 'Dashboard', href: '/' },
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
