import { blogArticles } from '../../data/blog'
import { ArticleCard } from '../../components/ArticleCard'
import styles from './BlogPage.module.css'

export default function BlogPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>Blog</h1>
        <div className={styles.grid}>
          {blogArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </div>
  )
}