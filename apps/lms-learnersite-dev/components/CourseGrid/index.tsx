'use client';

import { CourseCard } from '../CourseCard';
import type { MockCourse } from '../../lib/mockData';
import styles from './CourseGrid.module.css';

interface CourseGridProps {
  courses: MockCourse[];
}

export function CourseGrid({ courses }: CourseGridProps) {
  if (courses.length === 0) {
    return <p className={styles.empty}>No courses available.</p>;
  }

  return (
    <div className={styles.grid}>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
