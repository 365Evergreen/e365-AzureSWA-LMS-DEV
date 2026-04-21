import { useParams } from 'react-router-dom'
import { LoadingSpinner, sanitizeHtml } from '@lms/shared-ui'
import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import { blogArticles } from '../../data/blog'
import styles from './BlogPostPage.module.css'

function formatUkDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogPostPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { metadata, blocks, loading, error } = usePage(slug, 'post')

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // If API returned content, render it
  if (!error && metadata && blocks.length > 0) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <a href="/blog" className={styles.back}>← Back to Blog</a>
          <div className={styles.meta}>
            <time className={styles.date} dateTime={metadata.publishedAt}>
              {formatUkDate(metadata.publishedAt)}
            </time>
            {metadata.tags && metadata.tags.length > 0 && (
              <div className={styles.tags}>
                {metadata.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <h1 className={styles.heading}>{metadata.title}</h1>
          <PublicBlockRenderer blocks={blocks} />
        </div>
      </div>
    )
  }

  // Fallback to static data
  const article = blogArticles.find((a) => a.slug === slug)
  if (!article) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.heading}>Article not found</h1>
          <p className={styles.notFound}>
            The article you are looking for does not exist.{' '}
            <a href="/blog" className={styles.backLink}>Back to Blog</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <a href="/blog" className={styles.back}>← Back to Blog</a>
        <div className={styles.meta}>
          <time className={styles.date} dateTime={article.date}>
            {formatUkDate(article.date)}
          </time>
          <div className={styles.tags}>
            {article.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
        <h1 className={styles.heading}>{article.title}</h1>
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.body) }}
        />
      </div>
    </div>
  )
}
