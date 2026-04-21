import { Link } from 'react-router-dom'
import { useCatalogue } from '../../hooks/useCatalogue'
import { CourseCard } from '../CourseCard'
import styles from './FeaturedCourses.module.css'

const FEATURED_COUNT = 3

export function FeaturedCourses() {
  const { courses, loading } = useCatalogue()
  const featured = courses.slice(0, FEATURED_COUNT)

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h2 className={styles.heading}>Featured courses</h2>
          </div>
          <div className={styles.grid}>
            {Array.from({ length: FEATURED_COUNT }).map((_, i) => (
              <div key={i} className={styles.skeleton} aria-hidden="true" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!featured.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.heading}>Featured courses</h2>
          <Link to="/catalogue" className={styles.viewAll}>
            View all courses <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className={styles.grid}>
          {featured.map((course) => (
            <CourseCard key={course.courseId} course={course} />
          ))}
        </div>
      </div>
    </section>
  )
}
