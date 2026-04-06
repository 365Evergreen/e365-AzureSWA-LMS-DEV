import { useState } from 'react'
import { kbArticles } from '../../data/kb'
import { KBArticleCard } from '../../components/KBArticleCard'
import { AudienceFilter } from '../../components/AudienceFilter'
import type { AudienceFilterValue } from '../../components/AudienceFilter'
import styles from './KBPage.module.css'

export default function KBPage() {
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterValue>('all')

  const filteredArticles = kbArticles.filter((article) => {
    if (audienceFilter === 'all') return true
    return article.audience === audienceFilter || article.audience === 'both'
  })

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>Knowledge Base</h1>

        <div className={styles.controls}>
          <AudienceFilter value={audienceFilter} onChange={setAudienceFilter} />
          <div className={styles.versionRow}>
            <span className={styles.versionBadgeCurrent}>Current</span>
            <span className={styles.versionBadgePrevious}>Previous</span>
          </div>
        </div>

        <div className={styles.grid}>
          {filteredArticles.map((article) => (
            <KBArticleCard key={article.slug} article={article} />
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <p className={styles.empty}>No articles found for the selected audience.</p>
        )}
      </div>
    </div>
  )
}