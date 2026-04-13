import { useState, useMemo } from 'react'
import { useCatalogue } from '../../hooks/useCatalogue'
import { CourseCard } from '../../components/CourseCard'
import { BlogFilters } from '../../components/BlogFilters'
import { ViewToggle, type ViewMode } from '../../components/ViewToggle'
import { ArchiveHeader } from '../../components/ArchiveHeader'
import styles from './CataloguePage.module.css'

export default function CataloguePage() {
  const [tag, setTag] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const learnerBaseUrl = import.meta.env.VITE_LEARNER_BASE_URL ?? 'https://lmsle.365evergreendev.com'

  const { courses, loading, error, refetch } = useCatalogue()

  const filtered = useMemo(
    () => tag ? courses.filter((course) => course.tags.includes(tag)) : courses,
    [courses, tag],
  )

  const allTags = useMemo(
    () => Array.from(new Set(courses.flatMap((course) => course.tags))).sort(),
    [courses],
  )

  return (
    <div className={styles.page}>
      <ArchiveHeader
        slug="course-catalogue"
        fallbackTitle="Course Catalogue"
        fallbackSubtitle="Browse our library of courses and start learning today."
      />

      <div className={styles.listing}>
        <div className={styles.toolbar}>
          <BlogFilters
            categories={allTags}
            selectedCategory={tag}
            onCategoryChange={setTag}
            onReset={() => setTag('')}
          />
          <div className={styles.toolbarRight}>
            {!loading && !error && (
              <span className={styles.count}>
                {filtered.length} {filtered.length === 1 ? 'course' : 'courses'}
              </span>
            )}
            <ViewToggle view={view} onViewChange={setView} />
          </div>
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
          <div className={view === 'grid' ? styles.grid : styles.listView}>
            {filtered.length === 0
              ? <p className={styles.empty}>No courses published yet.</p>
              : filtered.map((course) => (
                  <CourseCard key={course.courseId} course={course} learnerBaseUrl={learnerBaseUrl} view={view} />
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
