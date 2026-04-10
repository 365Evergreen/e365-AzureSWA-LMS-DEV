'use client';

import Link from 'next/link';
import { AuthGuard } from '../components/AuthGuard';
import { CourseGrid } from '../components/CourseGrid';
import { useCatalogue } from '../lib/hooks/useCatalogue';
import styles from './home.module.css';

function HomePageContent() {
  const { loading, data, error } = useCatalogue();
  const enrolledCourses = data?.filter((course) => course.enrolled) ?? [];
  const featuredCourses = enrolledCourses.slice(0, 3);
  const completedCount = enrolledCourses.filter((course) => course.progress >= 100).length;
  const inProgressCount = enrolledCourses.filter((course) => course.progress > 0 && course.progress < 100).length;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>LMS Learner</span>
          <h1 className={styles.headline}>Keep your learning moving forward.</h1>
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
              <span className={styles.statValue}>{enrolledCourses.length}</span>
              <span className={styles.statLabel}>Enrolled courses</span>
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
              Jump back into the courses you are enrolled in.
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
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  );
}
