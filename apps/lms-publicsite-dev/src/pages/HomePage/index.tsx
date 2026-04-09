import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import { Hero } from './Hero/Hero'
import { FeatureGrid } from './FeatureGrid/FeatureGrid'
import { KBTeaser } from './KBTeaser/KBTeaser'
import { LoadingSpinner } from '@lms/shared-ui'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { blocks, loading, error } = usePage('home')
  const hasCmsContent = !loading && !error && blocks.length > 0

  return (
    <div className={styles.page}>
      {loading && (
        <div className={styles.loading}>
          <LoadingSpinner />
        </div>
      )}

      {hasCmsContent && (
        <div className={styles.cmsContent}>
          <PublicBlockRenderer blocks={blocks} />
        </div>
      )}

      {!loading && (
        <>
          {!hasCmsContent && <Hero />}
          <FeatureGrid />
          <KBTeaser />
        </>
      )}
    </div>
  )
}