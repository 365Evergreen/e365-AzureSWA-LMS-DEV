import styles from './KBTeaser.module.css'

const STUB_ARTICLES = [
  { title: 'Creating Your First Course', slug: 'creating-your-first-course' },
  { title: 'Navigating Your Learning Dashboard', slug: 'navigating-learning-dashboard' },
  { title: 'Getting Help as a Learner', slug: 'getting-help-learner' },
]

export function KBTeaser() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Latest from the Knowledge Base</h2>
        <ul className={styles.list}>
          {STUB_ARTICLES.map((article) => (
            <li key={article.slug} className={styles.item}>
              <a href={`/kb/${article.slug}`} className={styles.link}>
                {article.title}
              </a>
            </li>
          ))}
        </ul>
        <a href="/kb" className={styles.allLink}>Browse all articles →</a>
      </div>
    </section>
  )
}