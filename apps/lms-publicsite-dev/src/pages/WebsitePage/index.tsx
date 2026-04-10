import { useParams, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@lms/shared-ui'
import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import type { Block } from '../../components/PublicBlockRenderer'
import styles from './WebsitePage.module.css'

export default function WebsitePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { metadata, blocks, loading, error } = usePage(slug)

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !metadata) {
    return <Navigate to="/404" replace />
  }

  const heroIndex = blocks.findIndex((b) => b.type === 'hero')
  const hasHero = heroIndex !== -1
  const heroBlock = hasHero ? blocks[heroIndex] : null
  const otherBlocks = hasHero ? blocks.filter((_, i) => i !== heroIndex) : blocks

  return (
    <article className={styles.page}>
      {heroBlock && <PublicBlockRenderer blocks={[heroBlock as Block]} />}
      <div className={styles.inner}>
        {!hasHero && (
          <header className={styles.header}>
            <h1 className={styles.title}>{metadata.title}</h1>
            {metadata.description && (
              <p className={styles.description}>{metadata.description}</p>
            )}
          </header>
        )}
        {otherBlocks.length > 0 && <PublicBlockRenderer blocks={otherBlocks as Block[]} />}
      </div>
    </article>
  )
}
