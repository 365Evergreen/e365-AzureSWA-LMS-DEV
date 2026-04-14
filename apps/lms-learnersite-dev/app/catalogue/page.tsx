'use client';

import { AuthGuard } from '../../components/AuthGuard';
import { CourseGrid } from '../../components/CourseGrid';
import { useCatalogue } from '../../lib/hooks/useCatalogue';
import styles from './catalogue.module.css';

export default function CataloguePage() {
  const { loading, data, error } = useCatalogue();
  const myCourses = data?.filter((course) => course.isMandatory ? course.progress < 100 : course.enrolled) ?? [];

  return (
    <AuthGuard>
      <div className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>My Courses</h1>
          {loading && <p>Loading courses…</p>}
          {error && <p className={styles.error}>Failed to load courses.</p>}
          {myCourses && <CourseGrid courses={myCourses} />}
        </div>
      </div>
    </AuthGuard>
  );
}
