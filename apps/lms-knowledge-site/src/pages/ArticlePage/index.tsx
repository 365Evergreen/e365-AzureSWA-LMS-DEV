import React, { Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LoadingSpinner } from '@lms/shared-ui'
import { Layout } from '../../components/Layout'
import { AudienceBadge } from '../../components/AudienceBadge'
import { VersionBadge } from '../../components/VersionBadge'
import { articles } from '../../data/articles'
import styles from './ArticlePage.module.css'

const ArticleRenderer = React.lazy(() => import('../../components/ArticleRenderer'))

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = articles.find(a => a.slug === slug)

  if (!article) {
    return (
      <Layout>
        <div className={styles.notFound}>
          <h1 className={styles.notFoundTitle}>Article Not Found</h1>
          <p className={styles.notFoundMsg}>The article you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/articles" className={styles.backLink}>← Back to Articles</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <article className={styles.article}>
        <nav className={styles.breadcrumb}>
          <Link to="/articles" className={styles.breadcrumbLink}>Articles</Link>
          <span className={styles.breadcrumbSep}>→</span>
          <span className={styles.breadcrumbCurrent}>{article.title}</span>
        </nav>
        <header className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.badges}>
            <AudienceBadge audience={article.audience} />
            <VersionBadge version={article.version} />
          </div>
          <div className={styles.tags}>
            {article.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </header>
        <Suspense fallback={<LoadingSpinner />}>
          <ArticleRenderer content={article.body} />
        </Suspense>
        <div className={styles.footer}>
          <Link to="/articles" className={styles.backLink}>← Back to Articles</Link>
        </div>
      </article>
    </Layout>
  )
}
