'use client';

import { AuthGuard } from '../../components/AuthGuard';
import { AppNav } from '../../components/AppNav';
import { CourseGrid } from '../../components/CourseGrid';
import { useCatalogue } from '../../lib/hooks/useCatalogue';
import styles from './catalogue.module.css';

export default function CataloguePage() {
  const { loading, data, error } = useCatalogue();

  return (
    <AuthGuard>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>My Courses</h1>
          {loading && <p>Loading courses…</p>}
          {error && <p className={styles.error}>Failed to load courses.</p>}
          {data && <CourseGrid courses={data} />}
        </div>
      </main>
    </AuthGuard>
  );
}
