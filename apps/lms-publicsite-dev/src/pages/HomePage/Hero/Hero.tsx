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
  label: 'Browse courses',
  href: '/catalogue',
}

const DEFAULT_SECONDARY_ACTION: HeroAction = {
  label: 'Request access',
  href: '/request-access',
}

export function Hero({
  headline = 'Develop the skills that move your team forward',
  subheadline = 'Browse role-based learning paths, courses, and assessments built for today’s workplace. Self-paced, on-demand, and designed for real results.',
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
