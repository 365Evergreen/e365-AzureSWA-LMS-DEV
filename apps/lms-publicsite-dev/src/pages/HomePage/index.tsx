import { lazy, Suspense } from 'react'
import { Helmet } from 'react-helmet-async'
import { usePage } from '../../hooks/usePage'
import type { Block } from '@lms/shared-schemas'
import { Hero } from './Hero/Hero'
import { StatsBar } from '../../components/StatsBar'
import { AudienceCards } from '../../components/AudienceCards'
import { FeaturedCourses } from '../../components/FeaturedCourses'
import { SocialProof } from '../../components/SocialProof'
import styles from './HomePage.module.css'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://lms.365evergreendev.com'
const PublicBlockRenderer = lazy(() =>
  import('../../components/PublicBlockRenderer').then((module) => ({
    default: module.PublicBlockRenderer,
  })),
)

export default function HomePage() {
  const { blocks, loading, error } = usePage('home')

  const title = '365 Evergreen Learning | Online Training for Microsoft 365'
  const description = 'Self-paced, role-based Microsoft 365 courses. Develop the skills that move your team forward.'
  const contentBlocks = blocks.filter((block) => block.type !== 'hero')
  const hasCmsContent = !loading && !error && contentBlocks.length > 0

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

      <Hero />

      {loading && (
        <div className={styles.cmsContent}>
          <div className={styles.contentPlaceholder} aria-hidden />
        </div>
      )}

      {hasCmsContent && contentBlocks.length > 0 && (
        <div className={styles.cmsContent}>
          <Suspense fallback={<div className={styles.contentPlaceholder} aria-hidden />}>
            <PublicBlockRenderer blocks={contentBlocks as Block[]} />
          </Suspense>
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
