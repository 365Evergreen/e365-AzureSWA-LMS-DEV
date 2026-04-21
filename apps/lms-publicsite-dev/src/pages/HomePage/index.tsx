import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import type { Block } from '../../components/PublicBlockRenderer'
import { Hero } from './Hero/Hero'
import { StatsBar } from '../../components/StatsBar'
import { FeaturedCourses } from '../../components/FeaturedCourses'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { blocks, loading, error } = usePage('home')
  const hasCmsContent = !loading && !error && blocks.length > 0
  const heroIndex = hasCmsContent ? blocks.findIndex((block) => block.type === 'hero') : -1
  const heroBlocks = heroIndex >= 0 ? [blocks[heroIndex]] : []
  const contentBlocks = heroIndex >= 0 ? blocks.filter((_, index) => index !== heroIndex) : blocks

  return (
    <div className={styles.page}>
      {hasCmsContent && heroBlocks.length > 0 ? (
        <PublicBlockRenderer blocks={heroBlocks as Block[]} />
      ) : (
        <Hero />
      )}

      {loading && (
        <div className={styles.cmsContent}>
          <div className={styles.contentPlaceholder} aria-hidden />
        </div>
      )}

      {hasCmsContent && contentBlocks.length > 0 && (
        <div className={styles.cmsContent}>
          <PublicBlockRenderer blocks={contentBlocks as Block[]} />
        </div>
      )}

      {!loading && !hasCmsContent && error && (
        <div className={styles.cmsContent}>
          <p className={styles.errorMessage}>We could not load the latest homepage content right now.</p>
        </div>
      )}

      <StatsBar />
      <FeaturedCourses />
    </div>
  )
}
