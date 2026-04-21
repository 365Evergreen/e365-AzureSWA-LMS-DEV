'use client';

import Link from 'next/link';
import { Nav } from '@lms/shared-ui';
import { Button } from '@lms/shared-ui';
import { useAuth, login, logout } from '@lms/shared-auth';
import { msalInstance } from '../../lib/msalConfig';
import { loginScopes } from '../../lib/authScopes';
import styles from './AppNav.module.css';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function AppNav() {
  const { user } = useAuth(msalInstance);

  const displayName = user?.account.name ?? user?.account.username ?? '';
  const initials = displayName ? getInitials(displayName) : '';

  const actions = (
    <div className={styles.actions}>
      {user && (
        <>
          <Link href="/profile" className={styles.avatarLink} title={displayName} aria-label="Go to profile">
            <span className={styles.avatar}>{initials}</span>
          </Link>
          <Link href="/profile" className={styles.profileLink}>
            Profile
          </Link>
        </>
      )}
      {user ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout(msalInstance)}
        >
          Sign out
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => login(msalInstance, loginScopes)}
        >
          Sign in
        </Button>
      )}
    </div>
  );

  return (
    <Nav
      logo={<Link href="/" className={styles.logoLink}><span className={styles.logo}>LMS Learner</span></Link>}
      items={[
        { label: 'Home', href: '/' },
        { label: 'Catalogue', href: '/catalogue' },
      ]}
      actions={actions}
    />
  );
}
