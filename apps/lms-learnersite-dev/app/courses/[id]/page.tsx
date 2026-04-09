'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { AppNav } from '../../../components/AppNav';
import { ProgressBar } from '../../../components/ProgressBar';
import { LoadingSpinner } from '@lms/shared-ui';
import { useCourse } from '../../../lib/hooks/useCourse';
import { useCatalogue } from '../../../lib/hooks/useCatalogue';
import styles from './course.module.css';

const BlockRenderer = dynamic(
  () => import('../../../components/BlockRenderer').then((m) => ({ default: m.BlockRenderer })),
  { loading: () => <LoadingSpinner /> },
);

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { loading, data: bundle, error } = useCourse(id);
  const { data: courses } = useCatalogue();
  const course = courses?.find((c) => c.id === id);
  const progress = course?.progress ?? 0;

  if (loading) {
    return (
      <>
        <AppNav />
        <div className={styles.loading}>Loading course…</div>
      </>
    );
  }

  if (error || !bundle) {
    return (
      <>
        <AppNav />
        <div className={styles.error}>Failed to load course.</div>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>{bundle.metadata.title}</h1>
            {bundle.metadata.description && (
              <p className={styles.description}>{bundle.metadata.description}</p>
            )}
            <div className={styles.progressWrapper}>
              <ProgressBar value={progress} />
            </div>
          </header>
          <div className={styles.blocks}>
            {bundle.blocks.map((block: any) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
