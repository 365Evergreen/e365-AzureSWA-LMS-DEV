import type { BlogArticle } from '../../data/blog'
import styles from './ArticleCard.module.css'

interface ArticleCardProps {
  article: BlogArticle
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <time className={styles.date} dateTime={article.date}>
          {new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <div className={styles.tags}>
          {article.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
      <h2 className={styles.title}>
        <a href={`/blog/${article.slug}`} className={styles.titleLink}>
          {article.title}
        </a>
      </h2>
      <p className={styles.excerpt}>{article.excerpt}</p>
      <a href={`/blog/${article.slug}`} className={styles.readMore}>
        Read more →
      </a>
    </article>
  )
}