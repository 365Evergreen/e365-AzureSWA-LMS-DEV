import type { ViewMode } from '../ViewToggle'
import type { CoursePage } from '../../hooks/useCoursePages'
import styles from './CoursePageCard.module.css'

interface CoursePageCardProps {
  page: CoursePage
  view?: ViewMode
}

export function CoursePageCard({ page, view = 'grid' }: CoursePageCardProps) {
  const initials = page.title.slice(0, 2).toUpperCase()
  const date = page.publishedAt
    ? new Date(page.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : null

  return (
    <a
      href={`/${page.slug}`}
      className={`${styles.card} ${view === 'list' ? styles.cardList : ''}`}
      aria-label={`View course: ${page.title}`}
    >
      <div className={styles.thumbnail} aria-hidden="true">
        {page.featuredImage
          ? <img src={page.featuredImage} alt="" className={styles.thumbnailImg} />
          : <span className={styles.initials}>{initials}</span>
        }
      </div>

      <div className={styles.body}>
        {page.tags.length > 0 && (
          <div className={styles.tags}>
            {page.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
        <h3 className={styles.title}>{page.title}</h3>
        {page.description && (
          <p className={styles.description}>{page.description}</p>
        )}
      </div>

      <div className={styles.footer}>
        {date && <span className={styles.date}>{date}</span>}
        <span className={styles.cta}>View course →</span>
      </div>
    </a>
  )
}
