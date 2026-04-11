import { useState, useMemo } from 'react'
import { useCoursePages } from '../../hooks/useCoursePages'
import { CoursePageCard } from '../../components/CoursePageCard'
import { BlogFilters } from '../../components/BlogFilters'
import { ViewToggle, type ViewMode } from '../../components/ViewToggle'
import { ArchiveHeader } from '../../components/ArchiveHeader'
import styles from './CataloguePage.module.css'

export default function CataloguePage() {
  const [tag, setTag] = useState('')
  const [view, setView] = useState<ViewMode>('grid')

  const { pages, allTags, loading, error, refetch } = useCoursePages()

  const filtered = useMemo(
    () => tag ? pages.filter((p) => p.tags.includes(tag)) : pages,
    [pages, tag],
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
              : filtered.map((page) => (
                  <CoursePageCard key={page.pageId} page={page} view={view} />
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
