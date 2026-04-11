'use client';

import { useAuth } from '@lms/shared-auth';
import { AuthGuard } from '../../components/AuthGuard';
import { ProfileBanner } from '../../components/ProfileBanner';
import { ProfileStats } from '../../components/ProfileStats';
import { ProgressBar } from '../../components/ProgressBar';
import { useCatalogue } from '../../lib/hooks/useCatalogue';
import { msalInstance } from '../../lib/msalConfig';
import styles from './profile.module.css';

type NavItem = 'Activity' | 'Achievements' | 'Transcript' | 'Settings';

const NAV_ITEMS: NavItem[] = ['Activity', 'Achievements', 'Transcript', 'Settings'];

function getStatusLabel(progress: number): { label: string; variant: 'completed' | 'inProgress' | 'notStarted' } {
  if (progress >= 100) return { label: 'Completed', variant: 'completed' };
  if (progress > 0) return { label: 'In Progress', variant: 'inProgress' };
  return { label: 'Not Started', variant: 'notStarted' };
}

function ProfilePageContent() {
  const { user } = useAuth(msalInstance);
  const { loading, data, error } = useCatalogue();

  const name = user?.account.name ?? user?.account.username ?? '';
  const email = user?.account.username ?? '';

  const enrolled = data?.filter((c) => c.enrolled) ?? [];
  const completed = enrolled.filter((c) => c.progress >= 100).length;
  const inProgress = enrolled.filter((c) => c.progress > 0 && c.progress < 100).length;
  const learningHours = completed * 2 + inProgress * 1;

  return (
    <div className={styles.page}>
      <ProfileBanner name={name} email={email} />

      <div className={styles.container}>
        <div className={styles.statsWrapper}>
          <ProfileStats
            enrolled={enrolled.length}
            completed={completed}
            inProgress={inProgress}
            learningHours={learningHours}
          />
        </div>

        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <nav>
              <ul className={styles.navList}>
                {NAV_ITEMS.map((item) => (
                  <li key={item}>
                    <button
                      className={`${styles.navItem} ${item === 'Activity' ? styles.navItemActive : ''}`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main className={styles.main}>
            <h2 className={styles.sectionTitle}>My Learning Activity</h2>

            {loading && <p className={styles.state}>Loading courses…</p>}
            {error && <p className={styles.stateError}>Failed to load courses.</p>}

            {data && (
              <div className={styles.activityList}>
                {enrolled.length === 0 && (
                  <p className={styles.state}>You are not enrolled in any courses yet.</p>
                )}
                {enrolled.map((course) => {
                  const { label, variant } = getStatusLabel(course.progress);
                  return (
                    <div key={course.id} className={styles.courseCard}>
                      <div className={styles.courseHeader}>
                        <span className={styles.courseTitle}>{course.title}</span>
                        <span className={`${styles.badge} ${styles[variant]}`}>{label}</span>
                      </div>
                      <ProgressBar value={course.progress} />
                      <span className={styles.progressText}>{course.progress}% complete</span>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}
