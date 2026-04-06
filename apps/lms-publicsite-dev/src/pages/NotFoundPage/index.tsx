import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <span className={styles.code}>404</span>
        <h1 className={styles.heading}>Page not found</h1>
        <p className={styles.message}>
          The page you are looking for does not exist or has been moved.
        </p>
        <a href="/" className={styles.homeLink}>Go back home →</a>
      </div>
    </div>
  )
}