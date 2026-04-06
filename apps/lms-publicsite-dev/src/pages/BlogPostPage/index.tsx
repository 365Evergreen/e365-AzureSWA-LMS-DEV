import { useParams } from 'react-router-dom'
import { blogArticles } from '../../data/blog'
import styles from './BlogPostPage.module.css'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
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
        <h1 className={styles.heading}>{article.title}</h1>
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </div>
    </div>
  )
}