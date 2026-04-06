import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <h1 className={styles.headline}>Build better learning experiences</h1>
        <p className={styles.subheadline}>
          The LMS Platform gives your team the tools to create, deliver, and iterate
          on world-class learning content—faster than ever.
        </p>
        <div className={styles.ctas}>
          <a href="/kb" className={styles.ctaPrimary}>Explore Knowledge Base</a>
          <a href="/blog" className={styles.ctaSecondary}>Read the Blog</a>
        </div>
      </div>
    </section>
  )
}