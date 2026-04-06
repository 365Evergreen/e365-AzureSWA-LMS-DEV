import { Button } from '@lms/shared-ui';
import { login } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  function handleSignIn() {
    const apiScope = import.meta.env.VITE_API_SCOPE as string | undefined;
    const scopes = apiScope ? [apiScope] : ['User.Read'];
    login(msalInstance, scopes);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>LMS Editor</h1>
        <p className={styles.subtitle}>Sign in to manage your courses</p>
        <Button onClick={handleSignIn}>Sign in with Microsoft</Button>
      </div>
    </div>
  );
}
