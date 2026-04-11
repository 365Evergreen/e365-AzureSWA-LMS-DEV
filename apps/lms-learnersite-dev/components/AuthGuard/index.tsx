'use client';

import { LoadingSpinner, Button } from '@lms/shared-ui';
import { useAuth, login } from '@lms/shared-auth';
import { msalInstance } from '../../lib/msalConfig';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth(msalInstance);

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
            onClick={() => login(msalInstance, ['User.Read'])}
          >
            Sign in with Microsoft
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
