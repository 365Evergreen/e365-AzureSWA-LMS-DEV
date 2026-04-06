import type { CourseMetadata } from '@lms/shared-schemas'
import styles from './CourseCard.module.css'

interface CourseCardProps {
  course: CourseMetadata
  learnerBaseUrl?: string
}

export function CourseCard({ course, learnerBaseUrl = '#' }: CourseCardProps) {
  const href = `${learnerBaseUrl}/courses/${course.slug}`
  const initials = course.title.slice(0, 2).toUpperCase()
  const duration = course.durationMinutes >= 60
    ? `${Math.floor(course.durationMinutes / 60)}h ${course.durationMinutes % 60}m`
    : `${course.durationMinutes}m`

  return (
    <a href={href} className={styles.card} aria-label={`View course: ${course.title}`}>
      {course.thumbnailUrl
        ? <img src={course.thumbnailUrl} alt="" className={styles.thumbnail} loading="lazy" />
        : <div className={styles.thumbnailPlaceholder} aria-hidden="true">{initials}</div>
      }

      <div className={styles.body}>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.badgeLevel}`}>{course.level}</span>
          <span className={`${styles.badge} ${styles.badgeAudience}`}>{course.audience}</span>
        </div>
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.description}>{course.description}</p>
      </div>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>📚 {course.moduleCount} modules</span>
          <span className={styles.metaItem}>⏱ {duration}</span>
        </div>
        <span className={styles.ctaLabel}>Start →</span>
      </div>
    </a>
  )
}
