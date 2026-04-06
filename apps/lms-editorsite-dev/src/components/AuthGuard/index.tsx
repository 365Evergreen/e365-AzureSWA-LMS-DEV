import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@lms/shared-auth';
import { LoadingSpinner } from '@lms/shared-ui';
import { msalInstance } from '../../auth/msalConfig';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth(msalInstance);

  if (isLoading) {
    return (
      <div className={styles.center}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
