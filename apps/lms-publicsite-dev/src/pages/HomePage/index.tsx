import { Helmet } from 'react-helmet-async'
import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import type { Block } from '../../components/PublicBlockRenderer'
import { Hero } from './Hero/Hero'
import { StatsBar } from '../../components/StatsBar'
import { AudienceCards } from '../../components/AudienceCards'
import { FeaturedCourses } from '../../components/FeaturedCourses'
import { SocialProof } from '../../components/SocialProof'
import styles from './HomePage.module.css'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://lms.365evergreendev.com'

export default function HomePage() {
  const { blocks, loading, error } = usePage('home')

  const title = '365 Evergreen Learning | Online Training for Microsoft 365'
  const description = 'Self-paced, role-based Microsoft 365 courses. Develop the skills that move your team forward.'
  const hasCmsContent = !loading && !error && blocks.length > 0
  const heroIndex = hasCmsContent ? blocks.findIndex((block) => block.type === 'hero') : -1
  const heroBlocks = heroIndex >= 0 ? [blocks[heroIndex]] : []
  const contentBlocks = heroIndex >= 0 ? blocks.filter((_, index) => index !== heroIndex) : blocks

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Helmet>
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
      <AudienceCards />
      <FeaturedCourses />
      <SocialProof />
    </div>
  )
}
