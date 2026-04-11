import { useArchiveHeader } from '../../hooks/useArchiveHeader'
import { PublicBlockRenderer } from '../PublicBlockRenderer'
import type { Block } from '../PublicBlockRenderer'
import styles from './ArchiveHeader.module.css'

interface ArchiveHeaderProps {
  /** The exact CMS page slug to fetch blocks from (e.g. 'course-catalogue', 'latest-posts') */
  slug: string
  /** Shown when no CMS header has been published yet */
  fallbackTitle: string
  fallbackSubtitle?: string
}

/**
 * Renders a CMS-managed archive page header when one exists.
 * Falls back to a plain hardcoded heading if the page hasn't been published.
 * Never blocks rendering of the listing content below it.
 */
export function ArchiveHeader({ slug, fallbackTitle, fallbackSubtitle }: ArchiveHeaderProps) {
  const { blocks, loading } = useArchiveHeader(slug)

  // Still fetching on first load — render nothing rather than a flicker.
  // The listing below renders immediately regardless.
  if (loading) return null

  // CMS page exists and has blocks — split hero (full-width) from the rest.
  if (blocks.length > 0) {
    const heroIdx = blocks.findIndex((b) => b.type === 'hero')
    const heroBlock = heroIdx !== -1 ? blocks[heroIdx] : null
    const otherBlocks = heroBlock ? blocks.filter((_, i) => i !== heroIdx) : blocks

    return (
      <header className={styles.cmsHeader}>
        {heroBlock && <PublicBlockRenderer blocks={[heroBlock as Block]} />}
        {otherBlocks.length > 0 && (
          <div className={styles.cmsInner}>
            <PublicBlockRenderer blocks={otherBlocks as Block[]} />
          </div>
        )}
      </header>
    )
  }

  // No CMS page yet — render a clean default heading.
  return (
    <header className={styles.fallbackHeader}>
      <div className={styles.fallbackInner}>
        <h1 className={styles.fallbackTitle}>{fallbackTitle}</h1>
        {fallbackSubtitle && (
          <p className={styles.fallbackSubtitle}>{fallbackSubtitle}</p>
        )}
      </div>
    </header>
  )
}
