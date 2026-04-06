'use client';

import { AuthGuard } from '../../components/AuthGuard';
import { AppNav } from '../../components/AppNav';
import { CourseGrid } from '../../components/CourseGrid';
import { mockCourses } from '../../lib/mockData';
import styles from './catalogue.module.css';

export default function CataloguePage() {
  return (
    <AuthGuard>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>My Courses</h1>
          <CourseGrid courses={mockCourses} />
        </div>
      </main>
    </AuthGuard>
  );
}
