'use client';

import { Nav } from '@lms/shared-ui';
import { Button } from '@lms/shared-ui';
import { useAuth, logout } from '@lms/shared-auth';
import { msalInstance } from '../../lib/msalConfig';
import styles from './AppNav.module.css';

export function AppNav() {
  const { user } = useAuth(msalInstance);

  const actions = (
    <div className={styles.actions}>
      {user && (
        <span className={styles.userName}>
          {user.account.name ?? user.account.username}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => logout(msalInstance)}
      >
        Sign out
      </Button>
    </div>
  );

  return (
    <Nav
      logo={<span className={styles.logo}>LMS Learner</span>}
      items={[{ label: 'Catalogue', href: '/catalogue' }]}
      actions={actions}
    />
  );
}
