import { useState, useMemo } from 'react'
import { Layout } from '../../components/Layout'
import { SearchBar } from '../../components/SearchBar'
import { AudienceFilter } from '../../components/AudienceFilter'
import { VersionSelector } from '../../components/VersionSelector'
import { ArticleCard } from '../../components/ArticleCard'
import { articles } from '../../data/articles'
import styles from './ArticleBrowserPage.module.css'

export default function ArticleBrowserPage() {
  const [search, setSearch] = useState('')
  const [audience, setAudience] = useState<'all' | 'editor' | 'learner'>('all')
  const [version, setVersion] = useState<'current' | 'previous' | 'all'>('all')

  const filtered = useMemo(() => {
    return articles.filter(article => {
      if (audience === 'editor' && article.audience !== 'editor' && article.audience !== 'both') return false
      if (audience === 'learner' && article.audience !== 'learner' && article.audience !== 'both') return false
      if (version === 'current' && article.version !== 'current') return false
      if (version === 'previous' && article.version !== 'previous') return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const inTitle = article.title.toLowerCase().includes(q)
        const inExcerpt = article.excerpt.toLowerCase().includes(q)
        const inTags = article.tags.join(' ').toLowerCase().includes(q)
        if (!inTitle && !inExcerpt && !inTags) return false
      }
      return true
    })
  }, [search, audience, version])

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.heading}>Knowledge Base</h1>
        <div className={styles.searchRow}>
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <div className={styles.controls}>
          <AudienceFilter value={audience} onChange={setAudience} />
          <VersionSelector value={version} onChange={setVersion} />
        </div>
        <p className={styles.count}>Showing {filtered.length} article{filtered.length !== 1 ? 's' : ''}</p>
        <div className={styles.grid}>
          {filtered.map(article => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </Layout>
  )
}
