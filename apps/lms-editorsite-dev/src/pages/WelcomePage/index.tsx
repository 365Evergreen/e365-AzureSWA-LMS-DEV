import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import { useAuth } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import AppNav from '../../components/AppNav';
import styles from './WelcomePage.module.css';

export default function WelcomePage() {
  const { user } = useAuth(msalInstance);
  const navigate = useNavigate();

  const displayName = user?.account.name ?? user?.account.username ?? 'there';
  const firstName = displayName.split(' ')[0];
  const isEditor = user?.roles.includes('ContentEditor') ?? false;

  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>Welcome back, {firstName} 👋</h1>
          <p className={styles.subtitle}>
            {isEditor
              ? 'You have content editor access. Create and manage courses below.'
              : 'You are signed in. Contact your administrator to be assigned a role.'}
          </p>
        </div>

        {isEditor && (
          <div className={styles.actions}>
            <div className={styles.card} onClick={() => navigate('/')} role="button" tabIndex={0}>
              <div className={styles.cardIcon}>📚</div>
              <h2 className={styles.cardTitle}>My Courses</h2>
              <p className={styles.cardDesc}>View and manage your course library</p>
              <Button variant="primary" size="sm">Go to Dashboard</Button>
            </div>
            <div className={styles.card} onClick={() => navigate('/editor/new')} role="button" tabIndex={0}>
              <div className={styles.cardIcon}>✏️</div>
              <h2 className={styles.cardTitle}>New Course</h2>
              <p className={styles.cardDesc}>Start building a new course from scratch</p>
              <Button variant="secondary" size="sm">Create Course</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
