'use client';

import Link from 'next/link';
import { Card } from '@lms/shared-ui';
import { Button } from '@lms/shared-ui';
import { ProgressBar } from '../ProgressBar';
import type { LearnerCourse } from '../../lib/apiClient';
import styles from './CourseCard.module.css';

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

interface CourseCardProps {
  course: LearnerCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const durationLabel = course.durationMinutes
    ? course.durationMinutes >= 60
      ? `${Math.round(course.durationMinutes / 60)}h`
      : `${course.durationMinutes}m`
    : null;

  return (
    <Card className={styles.card}>
      {course.thumbnailUrl && (
        <img src={course.thumbnailUrl} alt="" className={styles.thumbnail} />
      )}
      <div className={styles.body}>
        <div className={styles.header}>
          <h2 className={styles.title}>{course.title}</h2>
          {course.level && (
            <span className={styles.levelBadge}>{LEVEL_LABEL[course.level] ?? course.level}</span>
          )}
        </div>
        <p className={styles.description}>{course.description}</p>
        <div className={styles.meta}>
          {durationLabel && <span className={styles.metaItem}>⏱ {durationLabel}</span>}
          {course.moduleCount > 0 && (
            <span className={styles.metaItem}>{course.moduleCount} module{course.moduleCount !== 1 ? 's' : ''}</span>
          )}
          {course.isMandatory && (
            <span className={styles.tag}>Mandatory</span>
          )}
          {course.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
        {course.enrolled && course.progress > 0 && (
          <ProgressBar value={course.progress} />
        )}
        <div className={styles.actions}>
          <Link href={`/courses/${course.slug}`} className={styles.link}>
            <Button variant="primary" size="sm">
              {course.enrolled && course.progress > 0 ? 'Continue' : 'See more'}
            </Button>
          </Link>
          {!course.enrolled && (
            <Button variant="secondary" size="sm" disabled>
              {course.isMandatory ? 'Mandatory' : 'Not enrolled'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
