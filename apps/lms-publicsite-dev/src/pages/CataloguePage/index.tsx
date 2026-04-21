import { useState, useMemo } from 'react'
import { useCatalogue } from '../../hooks/useCatalogue'
import { CourseCard } from '../../components/CourseCard'
import { CatalogueFilters } from '../../components/CatalogueFilters'
import { ViewToggle, type ViewMode } from '../../components/ViewToggle'
import { ArchiveHeader } from '../../components/ArchiveHeader'
import styles from './CataloguePage.module.css'

export default function CataloguePage() {
  const [role, setRole] = useState('')
  const [level, setLevel] = useState('')
  const [courseType, setCourseType] = useState('')
  const [view, setView] = useState<ViewMode>('grid')

  const { courses, loading, error, refetch } = useCatalogue()

  const filtered = useMemo(() => {
    let result = courses
    if (role) result = result.filter((c) => c.audience === role || c.audience === 'all')
    if (level) result = result.filter((c) => c.level === level)
    if (courseType) result = result.filter((c) => c.tags.includes(courseType))
    return result
  }, [courses, role, level, courseType])

  return (
    <div className={styles.page}>
      <ArchiveHeader
        slug="course-catalogue"
        fallbackTitle="Course Catalogue"
        fallbackSubtitle="Browse our library of courses and start learning today."
      />

      <div className={styles.listing}>
        <div className={styles.toolbar}>
          <CatalogueFilters
            role={role}
            level={level}
            courseType={courseType}
            onRoleChange={setRole}
            onLevelChange={setLevel}
            onCourseTypeChange={setCourseType}
            onReset={() => { setRole(''); setLevel(''); setCourseType('') }}
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
              ? <p className={styles.empty}>No courses match the selected filters.</p>
              : filtered.map((course) => (
                  <CourseCard key={course.courseId} course={course} view={view} />
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
