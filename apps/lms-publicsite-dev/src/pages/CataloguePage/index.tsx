import { useState } from 'react'
import { useCatalogue } from '../../hooks/useCatalogue'
import { CourseCard } from '../../components/CourseCard'
import { CatalogueFilters } from '../../components/CatalogueFilters'
import styles from './CataloguePage.module.css'

const LEARNER_BASE_URL = import.meta.env.VITE_LEARNER_BASE_URL ?? ''

export default function CataloguePage() {
  const [audience, setAudience] = useState('')
  const [level, setLevel] = useState('')

  const { courses, total, loading, error, refetch } = useCatalogue({
    audience: audience || undefined,
    level: level || undefined,
  })

  function handleReset() {
    setAudience('')
    setLevel('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Course Catalogue</h1>
        <p className={styles.subtitle}>
          Browse our library of courses and start learning today.
        </p>
      </div>

      <div className={styles.toolbar}>
        <CatalogueFilters
          audience={audience}
          level={level}
          onAudienceChange={setAudience}
          onLevelChange={setLevel}
          onReset={handleReset}
        />
        {!loading && !error && (
          <span className={styles.count}>
            {total} {total === 1 ? 'course' : 'courses'}
          </span>
        )}
      </div>

      {loading && (
        <div className={styles.loading} aria-live="polite" aria-busy="true">
          <div className={styles.spinner} aria-hidden="true" />
          <span>Loading courses…</span>
        </div>
      )}

      {error && !loading && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.retryButton} onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.grid}>
          {courses.length === 0
            ? <p className={styles.empty}>No courses match your filters.</p>
            : courses.map((course) => (
                <CourseCard
                  key={course.courseId}
                  course={course}
                  learnerBaseUrl={LEARNER_BASE_URL}
                />
              ))
          }
        </div>
      )}
    </div>
  )
}
