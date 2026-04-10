'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { ProgressBar } from '../../../components/ProgressBar';
import { LoadingSpinner } from '@lms/shared-ui';
import { useCourse } from '../../../lib/hooks/useCourse';
import { useCatalogue } from '../../../lib/hooks/useCatalogue';
import styles from './course.module.css';

const BlockRenderer = dynamic(
  () => import('../../../components/BlockRenderer').then((m) => ({ default: m.BlockRenderer })),
  { loading: () => <LoadingSpinner /> },
);

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const slug = params.id;
  const { loading, data: course, error } = useCourse(slug);
  const { data: courses } = useCatalogue();
  const catalogueCourse = courses?.find((c) => c.slug === slug);
  const progress = catalogueCourse?.progress ?? course?.progress ?? 0;

  if (loading) {
    return <div className={styles.loading}>Loading course…</div>;
  }

  if (error || !course) {
    return <div className={styles.error}>Failed to load course.</div>;
  }

  const bundle = course.bundle;
  const title = course.title || bundle?.metadata.title || '';
  const description = course.description || bundle?.metadata.description;

  const durationLabel = course.durationMinutes
    ? course.durationMinutes >= 60
      ? `${Math.round(course.durationMinutes / 60)}h`
      : `${course.durationMinutes}m`
    : null;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} alt="" className={styles.thumbnail} />
        )}
        <header className={styles.header}>
          <div className={styles.courseMeta}>
            {course.level && (
              <span className={styles.levelBadge}>{LEVEL_LABEL[course.level] ?? course.level}</span>
            )}
            {durationLabel && <span className={styles.metaItem}>⏱ {durationLabel}</span>}
            {course.moduleCount > 0 && (
              <span className={styles.metaItem}>{course.moduleCount} module{course.moduleCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          <h1 className={styles.title}>{title}</h1>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
          {course.tags.length > 0 && (
            <div className={styles.tags}>
              {course.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}
          {progress > 0 && (
            <div className={styles.progressWrapper}>
              <ProgressBar value={progress} />
              <span className={styles.progressText}>{progress}% complete</span>
            </div>
          )}
        </header>
        {bundle && bundle.blocks.length > 0 && (
          <div className={styles.blocks}>
            {bundle.blocks.map((block: any) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
