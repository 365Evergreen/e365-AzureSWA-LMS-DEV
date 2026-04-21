import { PublicBlockRenderer } from '../PublicBlockRenderer'
import type { Block } from '../PublicBlockRenderer'
import { usePathDetail } from '../../hooks/usePathDetail'
import styles from './CourseLandingPage.module.css'

interface CourseLandingMetadata {
  title: string
  description: string
  featuredImage?: string
  tags?: string[]
  linkedCourseId?: string
  slug?: string
}

interface CourseLandingPageProps {
  metadata: CourseLandingMetadata
  blocks: Block[]
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '—'
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (!hours) return `${remainingMinutes} min`
  if (!remainingMinutes) return `${hours} hr`
  return `${hours} hr ${remainingMinutes} min`
}

function heroStyle(featuredImage?: string): React.CSSProperties | undefined {
  if (!featuredImage) return undefined
  return { backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.28)), url(${featuredImage})` }
}

export function CourseLandingPage({ metadata, blocks }: CourseLandingPageProps) {
  const heroIndex = blocks.findIndex((block) => block.type === 'hero')
  const heroBlock = heroIndex !== -1 ? blocks[heroIndex] : null
  const contentBlocks = heroIndex !== -1 ? blocks.filter((_, index) => index !== heroIndex) : blocks
  const { data: path, loading, error } = usePathDetail(metadata.linkedCourseId)

  const infoRows = [
    { label: 'Level', value: path?.difficulty ?? '—' },
    { label: 'Role', value: path?.role || '—' },
    { label: 'Duration', value: formatDuration(path?.estimatedMinutes) },
    { label: 'Tags', value: path?.tagsCsv ? path.tagsCsv.split(',').map((tag) => tag.trim()).filter(Boolean).join(', ') : (metadata.tags?.join(', ') || '—') },
  ]

  return (
    <article className={styles.page}>
      {heroBlock ? (
        <PublicBlockRenderer blocks={[heroBlock]} />
      ) : (
        <section className={styles.hero} style={heroStyle(metadata.featuredImage)}>
          <div className={styles.heroInner}>
            <span className={styles.eyebrow}>Course landing</span>
            <h1 className={styles.title}>{metadata.title}</h1>
            {metadata.description ? <p className={styles.description}>{metadata.description}</p> : null}
          </div>
        </section>
      )}

      <div className={styles.inner}>
        <section className={styles.infoCard} aria-labelledby="course-info-heading">
          <h2 id="course-info-heading" className={styles.infoHeading}>Course information</h2>
          <dl className={styles.infoGrid}>
            {infoRows.map((row) => (
              <div key={row.label} className={styles.infoItem}>
                <dt className={styles.infoLabel}>{row.label}</dt>
                <dd className={styles.infoValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {contentBlocks.length > 0 ? (
          <section className={styles.summarySection}>
            <PublicBlockRenderer blocks={contentBlocks} />
          </section>
        ) : metadata.description ? (
          <section className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <h2 className={styles.sectionTitle}>Course summary</h2>
              <p className={styles.summaryText}>{metadata.description}</p>
            </div>
          </section>
        ) : null}

        <section className={styles.modulesSection} aria-labelledby="modules-heading">
          <div className={styles.sectionHeader}>
            <h2 id="modules-heading" className={styles.sectionTitle}>Course modules</h2>
            {path ? <span className={styles.sectionMeta}>{path.modules.length} modules</span> : null}
          </div>

          {loading ? <p className={styles.state}>Loading module stack…</p> : null}
          {error ? <p className={styles.stateError}>Failed to load linked course modules.</p> : null}
          {!loading && !error && !path?.modules?.length ? (
            <p className={styles.state}>No modules are linked to this course yet.</p>
          ) : null}

          {!loading && !error && path?.modules?.length ? (
            <div className={styles.moduleStack}>
              {path.modules
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((module, index) => (
                  <article key={module.itemId} className={styles.moduleCard}>
                    <div className={styles.moduleNumber}>{index + 1}</div>
                    <div className={styles.moduleBody}>
                      <div className={styles.moduleHeader}>
                         <h3 className={styles.moduleTitle}>{module.title}</h3>
                         <span className={styles.moduleMeta}>
                           {formatDuration(module.estimatedMinutes)} · {module.units?.length ?? 0} units
                         </span>
                       </div>
                      {module.summary ? <p className={styles.moduleSummary}>{module.summary}</p> : null}
                    </div>
                  </article>
                ))}
            </div>
          ) : null}
        </section>

        <section className={styles.ctaSection} aria-labelledby="enroll-cta-heading">
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2 id="enroll-cta-heading" className={styles.ctaHeading}>Ready to start?</h2>
              <p className={styles.ctaText}>
                Request access to begin this course at your own pace.
              </p>
            </div>
            <a
              href={`/request-access${metadata.slug ? `?course=${encodeURIComponent(metadata.slug)}` : ''}`}
              className={styles.ctaButton}
            >
              Request access
            </a>
          </div>
        </section>
      </div>
    </article>
  )
}
