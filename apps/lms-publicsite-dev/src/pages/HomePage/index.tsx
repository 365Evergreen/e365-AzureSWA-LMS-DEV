import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import type { Block } from '../../components/PublicBlockRenderer'
import { Hero } from './Hero/Hero'
import { KBTeaser } from './KBTeaser/KBTeaser'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { blocks, loading, error } = usePage('home')
  const hasCmsContent = !loading && !error && blocks.length > 0

  const heroIndex = hasCmsContent ? blocks.findIndex((b) => b.type === 'hero') : -1
  const heroBlock = heroIndex !== -1 ? blocks[heroIndex] : null
  const otherBlocks = heroIndex !== -1 ? blocks.filter((_, i) => i !== heroIndex) : blocks
  const heroPayload = (heroBlock?.payload ?? {}) as Record<string, unknown>
  const heroHeadline = (heroPayload.heading as string | undefined)?.trim()
  const heroSubheading = [
    heroPayload.subheading as string | undefined,
    heroPayload.body as string | undefined,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
  const heroPrimaryAction = heroPayload.ctaLabel && heroPayload.ctaUrl
    ? {
        label: heroPayload.ctaLabel as string,
        href: heroPayload.ctaUrl as string,
      }
    : undefined

  return (
    <div className={styles.page}>
      <Hero
        headline={heroHeadline}
        subheadline={heroSubheading || undefined}
        primaryAction={heroPrimaryAction}
      />

      {loading && (
        <div className={styles.cmsContent}>
          <div className={styles.contentPlaceholder} aria-hidden />
        </div>
      )}

      {hasCmsContent && otherBlocks.length > 0 && (
        <div className={styles.cmsContent}>
          <PublicBlockRenderer blocks={otherBlocks as Block[]} />
        </div>
      )}

      {!loading && !hasCmsContent && error && (
        <div className={styles.cmsContent}>
          <p className={styles.errorMessage}>We could not load the latest homepage content right now.</p>
        </div>
      )}

      <KBTeaser />
    </div>
  )
}
