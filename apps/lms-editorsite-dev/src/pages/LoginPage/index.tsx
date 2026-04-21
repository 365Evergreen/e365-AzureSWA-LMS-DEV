import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import { LoadingSpinner } from '@lms/shared-ui';
import { login, useAuth } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import AppNav from '../../components/AppNav';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { user, isLoading } = useAuth(msalInstance);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.roles.includes('ContentEditor') ? '/dashboard' : '/welcome', { replace: true });
    }
  }, [isLoading, navigate, user]);

  function handleSignIn() {
    const apiScope = import.meta.env.VITE_API_SCOPE as string | undefined;
    const scopes = apiScope ? [apiScope] : ['User.Read'];
    login(msalInstance, scopes);
  }

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.content}>
        <div className={styles.card}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              <p className={styles.subtitle}>Checking your Microsoft 365 session…</p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Welcome back</h1>
              <p className={styles.subtitle}>Sign in with your Microsoft account to manage courses</p>
              <Button variant="primary" onClick={handleSignIn}>Sign in with Microsoft</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
