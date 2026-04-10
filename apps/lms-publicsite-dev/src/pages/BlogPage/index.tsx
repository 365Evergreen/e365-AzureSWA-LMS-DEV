import { blogArticles } from '../../data/blog'
import { ArticleCard } from '../../components/ArticleCard'
import { ArchiveHeader } from '../../components/ArchiveHeader'
import styles from './BlogPage.module.css'

export default function BlogPage() {
  return (
    <div className={styles.page}>
      <ArchiveHeader
        section="blog"
        fallbackTitle="Blog"
        fallbackSubtitle="News, updates, and articles from the team."
      />
      <div className={styles.inner}>
        <div className={styles.grid}>
          {blogArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </div>
  )
}