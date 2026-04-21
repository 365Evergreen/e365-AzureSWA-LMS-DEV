'use client';

import { useEffect, useRef } from 'react';
import { LoadingSpinner, Button } from '@lms/shared-ui';
import { useAuth, login } from '@lms/shared-auth';
import { msalInstance } from '../../lib/msalConfig';
import { loginScopes } from '../../lib/authScopes';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

const API_SCOPE = process.env.NEXT_PUBLIC_API_SCOPE ?? '';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, getAccessToken } = useAuth(msalInstance);
  const syncedAccountIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !API_SCOPE || !API_BASE_URL) {
      return;
    }

    const accountId = user.account.homeAccountId;
    if (syncedAccountIdRef.current === accountId) {
      return;
    }

    let cancelled = false;
    (async () => {
      const token = await getAccessToken([API_SCOPE]);
      if (!token || cancelled) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/signup-requests/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to accept signup request (${response.status})`);
      }

      if (!cancelled) {
        syncedAccountIdRef.current = accountId;
      }
    })().catch((error) => {
      console.error('[learner] failed to sync signup acceptance', error);
    });

    return () => {
      cancelled = true;
    };
  }, [getAccessToken, user]);

  if (isLoading) {
    return (
      <div className={styles.center}>
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loginPrompt}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>Sign in to LMS Learner</h1>
          <p className={styles.loginSubtitle}>
            Use your organisational account to access your courses.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => login(msalInstance, loginScopes)}
          >
            Sign in with Microsoft
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
