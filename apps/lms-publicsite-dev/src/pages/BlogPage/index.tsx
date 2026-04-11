import { useState, useMemo } from 'react'
import { useBlogPosts } from '../../hooks/useBlogPosts'
import { ArticleCard } from '../../components/ArticleCard'
import { BlogFilters } from '../../components/BlogFilters'
import { ViewToggle, type ViewMode } from '../../components/ViewToggle'
import { ArchiveHeader } from '../../components/ArchiveHeader'
import styles from './BlogPage.module.css'

export default function BlogPage() {
  const [category, setCategory] = useState('')
  const [view, setView] = useState<ViewMode>('grid')

  const { posts, allTags, loading, error, refetch } = useBlogPosts()

  const filtered = useMemo(
    () => category ? posts.filter((p) => p.tags.includes(category)) : posts,
    [posts, category],
  )

  return (
    <div className={styles.page}>
      <ArchiveHeader
        slug="latest-posts"
        fallbackTitle="Blog"
        fallbackSubtitle="News, updates, and articles from the team."
      />
      <div className={styles.inner}>
        <div className={styles.toolbar}>
          <BlogFilters
            categories={allTags}
            selectedCategory={category}
            onCategoryChange={setCategory}
            onReset={() => setCategory('')}
          />
          <div className={styles.toolbarRight}>
            {!loading && !error && (
              <span className={styles.count}>
                {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
              </span>
            )}
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {loading && (
          <div className={styles.loading} aria-live="polite" aria-busy="true">
            <div className={styles.spinner} aria-hidden="true" />
            <span>Loading posts…</span>
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
          filtered.length === 0
            ? <p className={styles.empty}>No posts published yet.</p>
            : (
              <div className={view === 'grid' ? styles.grid : styles.listView}>
                {filtered.map((post) => (
                  <ArticleCard key={post.pageId} article={post} view={view} />
                ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}
