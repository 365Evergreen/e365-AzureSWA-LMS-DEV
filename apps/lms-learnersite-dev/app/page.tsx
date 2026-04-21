'use client';

import Link from 'next/link';
import { Button, LoadingSpinner } from '@lms/shared-ui';
import { login, useAuth } from '@lms/shared-auth';
import { CourseGrid } from '../components/CourseGrid';
import { msalInstance } from '../lib/msalConfig';
import { loginScopes } from '../lib/authScopes';
import { useCatalogue } from '../lib/hooks/useCatalogue';
import styles from './home.module.css';

function HomePageContent({ displayName }: { displayName?: string }) {
  const { loading, data, error } = useCatalogue();
  const myCourses = data?.filter((course) => course.isMandatory ? course.progress < 100 : course.enrolled) ?? [];
  const featuredCourses = myCourses.slice(0, 3);
  const completedCount = (data ?? []).filter((course) => course.progress >= 100).length;
  const inProgressCount = myCourses.filter((course) => course.progress > 0 && course.progress < 100).length;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>LMS Learner</span>
          <h1 className={styles.headline}>
            {displayName ? `Welcome back, ${displayName}.` : 'Keep your learning moving forward.'}
          </h1>
          <p className={styles.subheadline}>
            Pick up where you left off, discover your next course, and track your
            progress from one place.
          </p>
          <div className={styles.ctas}>
            <Link href="/catalogue" className={styles.ctaPrimary}>Browse my courses</Link>
            <Link href="/profile" className={styles.ctaSecondary}>View my profile</Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{myCourses.length}</span>
              <span className={styles.statLabel}>Active courses</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{inProgressCount}</span>
              <span className={styles.statLabel}>In progress</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{completedCount}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Continue learning</h2>
            <p className={styles.sectionText}>
               Jump back into your active and mandatory learning.
            </p>
          </div>
          <Link href="/catalogue" className={styles.sectionLink}>See full catalogue</Link>
        </div>

        {loading && <p className={styles.state}>Loading your courses…</p>}
        {error && <p className={styles.stateError}>Failed to load courses.</p>}
        {!loading && !error && <CourseGrid courses={featuredCourses} />}
      </section>
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth(msalInstance);

  if (isLoading) {
    return (
      <div className={styles.authCenter}>
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

  return (
    <HomePageContent displayName={user.account.name ?? undefined} />
  );
}
