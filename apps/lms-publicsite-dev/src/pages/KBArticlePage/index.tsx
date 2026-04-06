import { useParams } from 'react-router-dom'
import { kbArticles } from '../../data/kb'
import { AudienceBadge } from '../../components/AudienceBadge'
import { VersionBadge } from '../../components/VersionBadge'
import styles from './KBArticlePage.module.css'

export default function KBArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = kbArticles.find((a) => a.slug === slug)

  if (!article) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <a href="/kb" className={styles.back}>← Back to Knowledge Base</a>
          <h1 className={styles.heading}>Article not found</h1>
          <p className={styles.notFound}>
            The article you are looking for does not exist.{' '}
            <a href="/kb" className={styles.backLink}>Browse all articles</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <a href="/kb" className={styles.back}>← Back to Knowledge Base</a>
        <div className={styles.badges}>
          <AudienceBadge audience={article.audience} />
          <VersionBadge version={article.version} />
        </div>
        <h1 className={styles.heading}>{article.title}</h1>
        <p className={styles.excerpt}>{article.excerpt}</p>
        <div className={styles.divider} />
        <p className={styles.body}>{article.body}</p>
      </div>
    </div>
  )
}