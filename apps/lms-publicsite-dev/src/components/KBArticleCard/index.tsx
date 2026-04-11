import type { KBArticle } from '../../data/kb'
import { AudienceBadge } from '../AudienceBadge'
import { VersionBadge } from '../VersionBadge'
import styles from './KBArticleCard.module.css'

interface KBArticleCardProps {
  article: KBArticle
}

export function KBArticleCard({ article }: KBArticleCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.badges}>
        <AudienceBadge audience={article.audience} />
        <VersionBadge version={article.version} />
      </div>
      <h2 className={styles.title}>
        <a href={`/kb/${article.slug}`} className={styles.titleLink}>
          {article.title}
        </a>
      </h2>
      <p className={styles.excerpt}>{article.excerpt}</p>
      <a href={`/kb/${article.slug}`} className={styles.readMore}>
        Read article →
      </a>
    </article>
  )
}