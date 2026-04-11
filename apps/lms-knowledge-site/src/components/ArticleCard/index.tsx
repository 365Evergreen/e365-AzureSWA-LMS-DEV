import { Link } from 'react-router-dom'
import { Card } from '@lms/shared-ui'
import { AudienceBadge } from '../AudienceBadge'
import { VersionBadge } from '../VersionBadge'
import type { KBArticle } from '../../data/articles'
import styles from './ArticleCard.module.css'

interface ArticleCardProps {
  article: KBArticle
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>
        <Link to={`/articles/${article.slug}`} className={styles.titleLink}>
          {article.title}
        </Link>
      </h2>
      <p className={styles.excerpt}>{article.excerpt}</p>
      <div className={styles.badges}>
        <AudienceBadge audience={article.audience} />
        <VersionBadge version={article.version} />
      </div>
      <div className={styles.tags}>
        {article.tags.map(tag => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
    </Card>
  )
}
