'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, LoadingSpinner } from '@lms/shared-ui';
import { useAuth } from '@lms/shared-auth';
import { AuthGuard } from '../../../components/AuthGuard';
import { useCourse } from '../../../lib/hooks/useCourse';
import { usePathDetail } from '../../../lib/hooks/usePathDetail';
import { createApiClient } from '../../../lib/apiClient';
import { msalInstance } from '../../../lib/msalConfig';
import styles from './course.module.css';

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const slug = params.id;
  const { loading, data: course, error } = useCourse(slug);
  const { data: pathDetail } = usePathDetail(course?.id);
  const { getAccessToken } = useAuth(msalInstance);
  const [enrolmentState, setEnrolmentState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [enrolmentError, setEnrolmentError] = useState<string | null>(null);

  if (loading) {
    return (
      <AuthGuard>
        <div className={styles.loading}>Loading course…</div>
      </AuthGuard>
    );
  }

  if (error || !course) {
    return (
      <AuthGuard>
        <div className={styles.error}>Failed to load course.</div>
      </AuthGuard>
    );
  }

  const title = course.title || course.bundle?.metadata.title || '';
  const description = course.description || course.bundle?.metadata.description || '';
  const modules = pathDetail?.modules ?? [];
  const tags = pathDetail?.tagsCsv
    ? pathDetail.tagsCsv.split(',').map((tag) => tag.trim()).filter(Boolean)
    : course.tags;
  const isEnrolled = course.enrolled || enrolmentState === 'success';
  const courseId = course.id;

  const durationLabel = course.durationMinutes
    ? course.durationMinutes >= 60
      ? `${Math.round(course.durationMinutes / 60)}h`
      : `${course.durationMinutes}m`
    : null;

  const details = useMemo(
    () => [
      { label: 'Level', value: LEVEL_LABEL[course.level] ?? course.level },
      { label: 'Role', value: pathDetail?.role || course.role || 'Learner' },
      { label: 'Duration', value: durationLabel || 'Self-paced' },
      { label: 'Tags', value: tags.length > 0 ? tags.join(', ') : 'General' },
    ],
    [course.level, course.role, durationLabel, pathDetail?.role, tags]
  );

  async function handleEnrol() {
    if (isEnrolled || !courseId) {
      return;
    }

    setEnrolmentState('submitting');
    setEnrolmentError(null);

    try {
      const apiScope = process.env.NEXT_PUBLIC_API_SCOPE;
      const getToken = apiScope ? () => getAccessToken([apiScope]) : undefined;
      const client = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL, getToken });
      await client.enrolCourse(courseId);
      setEnrolmentState('success');
    } catch (err) {
      setEnrolmentState('error');
      setEnrolmentError(err instanceof Error ? err.message : 'Failed to enrol in course.');
    }
  }

  return (
    <AuthGuard>
      <main className={styles.page}>
        <section
          className={styles.hero}
          style={
            course.thumbnailUrl
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.55)), url(${course.thumbnailUrl})`,
                }
              : undefined
          }
        >
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <span className={styles.heroEyebrow}>Course overview</span>
              <h1 className={styles.heroTitle}>{title}</h1>
              <p className={styles.heroDescription}>
                {description || 'Review the course structure and enrol when you are ready to begin.'}
              </p>
              <div className={styles.heroActions}>
                <Button
                  variant="primary"
                  onClick={handleEnrol}
                  disabled={isEnrolled || enrolmentState === 'submitting'}
                >
                  {isEnrolled ? 'Enrolled' : enrolmentState === 'submitting' ? 'Enrolling…' : 'Enrol now'}
                </Button>
                <span className={styles.heroMeta}>
                  {course.moduleCount} module{course.moduleCount !== 1 ? 's' : ''}
                  {durationLabel ? ` • ${durationLabel}` : ''}
                </span>
              </div>
              {enrolmentError && <p className={styles.heroError}>{enrolmentError}</p>}
            </div>
          </div>
        </section>

        <div className={styles.container}>
          <section className={styles.detailsCard}>
            <h2 className={styles.sectionTitle}>At a glance</h2>
            <dl className={styles.detailsGrid}>
              {details.map((detail) => (
                <div key={detail.label} className={styles.detailItem}>
                  <dt className={styles.detailLabel}>{detail.label}</dt>
                  <dd className={styles.detailValue}>{detail.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.summarySection}>
            <h2 className={styles.sectionTitle}>Course summary</h2>
            <p className={styles.summaryText}>
              {description || 'Summary information will appear here once it has been added to the course.'}
            </p>
            {pathDetail?.learningPath || course.learningPath ? (
              <p className={styles.summaryMeta}>Subject: {pathDetail?.learningPath || course.learningPath}</p>
            ) : null}
          </section>

          <section className={styles.modulesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Course modules</h2>
              {pathDetail && <span className={styles.sectionMeta}>{modules.length} in this course</span>}
            </div>

            {pathDetail && modules.length === 0 && (
              <p className={styles.emptyState}>Modules will appear here once the course structure is published.</p>
            )}

            {!pathDetail && (
              <div className={styles.pathLoading}>
                <LoadingSpinner />
              </div>
            )}

            <div className={styles.moduleStack}>
              {modules.map((module, index) => {
                const moduleDuration = module.estimatedMinutes
                  ? module.estimatedMinutes >= 60
                    ? `${Math.round(module.estimatedMinutes / 60)}h`
                    : `${module.estimatedMinutes}m`
                  : 'Self-paced';

                return (
                  <article key={module.itemId} className={styles.moduleCard}>
                    <div className={styles.moduleBadge}>Module {index + 1}</div>
                    <div className={styles.moduleBody}>
                      <div className={styles.moduleHeader}>
                        <h3 className={styles.moduleTitle}>{module.title}</h3>
                        <span className={styles.moduleDuration}>{moduleDuration}</span>
                      </div>
                      <p className={styles.moduleSummary}>
                        {module.summary || 'Module summary will be available after the editor adds it.'}
                      </p>
                      {module.isOptional && <span className={styles.optionalBadge}>Optional</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
