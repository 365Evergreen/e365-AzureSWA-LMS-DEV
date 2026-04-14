import styles from './Hero.module.css'

interface HeroAction {
  label: string
  href: string
}

interface HeroProps {
  headline?: string
  subheadline?: string
  primaryAction?: HeroAction
  secondaryAction?: HeroAction
}

const DEFAULT_PRIMARY_ACTION: HeroAction = {
  label: 'Explore Knowledge Base',
  href: '/kb',
}

const DEFAULT_SECONDARY_ACTION: HeroAction = {
  label: 'Read the Blog',
  href: '/blog',
}

export function Hero({
  headline = 'Build better learning experiences',
  subheadline = 'The LMS Platform gives your team the tools to create, deliver, and iterate on world-class learning content-faster than ever.',
  primaryAction = DEFAULT_PRIMARY_ACTION,
  secondaryAction = DEFAULT_SECONDARY_ACTION,
}: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <h1 className={styles.headline}>{headline}</h1>
        <p className={styles.subheadline}>{subheadline}</p>
        <div className={styles.ctas}>
          <a href={primaryAction.href} className={styles.ctaPrimary}>{primaryAction.label}</a>
          <a href={secondaryAction.href} className={styles.ctaSecondary}>{secondaryAction.label}</a>
        </div>
      </div>
    </section>
  )
}
