import { Button } from '@lms/shared-ui';
import { login } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import AppNav from '../../components/AppNav';
import styles from './LoginPage.module.css';

export default function LoginPage() {
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
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in with your Microsoft account to manage courses</p>
          <Button variant="primary" onClick={handleSignIn}>Sign in with Microsoft</Button>
        </div>
      </div>
    </div>
  );
}
