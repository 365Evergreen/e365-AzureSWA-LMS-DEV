import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import type { Block } from '../../components/PublicBlockRenderer'
import { Hero } from './Hero/Hero'
import { KBTeaser } from './KBTeaser/KBTeaser'
import { LoadingSpinner } from '@lms/shared-ui'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { blocks, loading, error } = usePage('home')
  const hasCmsContent = !loading && !error && blocks.length > 0

  const heroIndex = hasCmsContent ? blocks.findIndex((b) => b.type === 'hero') : -1
  const heroBlock = heroIndex !== -1 ? blocks[heroIndex] : null
  const otherBlocks = heroIndex !== -1 ? blocks.filter((_, i) => i !== heroIndex) : blocks

  return (
    <div className={styles.page}>
      {loading && (
        <div className={styles.loading}>
          <LoadingSpinner />
        </div>
      )}

      {/* Hero rendered outside the constrained container so it's truly full-bleed */}
      {hasCmsContent && heroBlock && (
        <PublicBlockRenderer blocks={[heroBlock as Block]} />
      )}

      {hasCmsContent && otherBlocks.length > 0 && (
        <div className={styles.cmsContent}>
          <PublicBlockRenderer blocks={otherBlocks as Block[]} />
        </div>
      )}

      {!loading && (
        <>
          {!hasCmsContent && <Hero />}
         <KBTeaser />
        </>
      )}
    </div>
  )
}