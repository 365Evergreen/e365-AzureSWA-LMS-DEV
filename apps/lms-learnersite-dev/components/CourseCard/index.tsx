'use client';

import Link from 'next/link';
import { Card } from '@lms/shared-ui';
import { Button } from '@lms/shared-ui';
import { ProgressBar } from '../ProgressBar';
import { StatusBadge } from '../StatusBadge';
import type { MockCourse } from '../../lib/mockData';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  course: MockCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{course.title}</h2>
        <StatusBadge enrolled={course.enrolled} />
      </div>
      <p className={styles.description}>{course.description}</p>
      <ProgressBar value={course.progress} />
      <div className={styles.actions}>
        {course.enrolled ? (
          <Link href={`/courses/${course.id}`} className={styles.link}>
            <Button variant="primary" size="sm">
              Open Course
            </Button>
          </Link>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            Not enrolled
          </Button>
        )}
      </div>
    </Card>
  );
}
