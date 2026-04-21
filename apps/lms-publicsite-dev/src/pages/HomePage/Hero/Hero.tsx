import styles from './Hero.module.css'

interface HeroProps {
  headline?: string
  subheadline?: string
  ctaLabel?: string
  ctaHref?: string
}

export function Hero({
  headline = 'Turn Microsoft\u00a0365 into your team\u2019s competitive edge',
  subheadline = 'Role-based learning paths that build real capability \u2014 not just certificate counts.',
  ctaLabel = 'Browse free courses',
  ctaHref = '/catalogue',
}: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>

        {/* ── Left: copy column ─────────────────────────────── */}
        <div className={styles.content}>
          <div className={styles.badge}>Microsoft 365 Training</div>
          <h1 className={styles.headline}>{headline}</h1>
          <p className={styles.subheadline}>{subheadline}</p>
          <a href={ctaHref} className={styles.cta}>{ctaLabel}</a>
          <p className={styles.ctaMeta}>Self-paced &middot; Role-based &middot; On-demand</p>
        </div>

        {/* ── Right: CSS-drawn Teams-style UI ───────────────── */}
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.appChrome}>

            {/* Window chrome bar */}
            <div className={styles.chromeBar}>
              <div className={styles.chromeDots}>
                <span className={styles.dot} data-color="red" />
                <span className={styles.dot} data-color="yellow" />
                <span className={styles.dot} data-color="green" />
              </div>
              <span className={styles.chromeTitle}>Microsoft Teams</span>
            </div>

            {/* App body: sidebar + main */}
            <div className={styles.appBody}>
              <div className={styles.sidebar}>
                <span className={styles.sideIcon} data-active="true" />
                <span className={styles.sideIcon} />
                <span className={styles.sideIcon} />
                <span className={styles.sideIcon} />
                <span className={styles.sideIcon} />
              </div>

              <div className={styles.mainArea}>
                <div className={styles.channelHeader}>
                  <div className={styles.channelTitle} />
                  <span className={styles.channelBadge}>Live training</span>
                </div>

                <div className={styles.messages}>
                  <div className={styles.msg}>
                    <span className={styles.avatar} data-color="blue" />
                    <div className={styles.msgBody}>
                      <div className={styles.msgName} />
                      <div className={styles.msgLine} />
                      <div className={`${styles.msgLine} ${styles.msgLineShort}`} />
                    </div>
                  </div>

                  <div className={styles.msg}>
                    <span className={styles.avatar} data-color="purple" />
                    <div className={styles.msgBody}>
                      <div className={styles.msgName} />
                      <div className={styles.msgLine} />
                    </div>
                  </div>

                  {/* Pinned learning card */}
                  <div className={styles.learningCard}>
                    <span className={styles.learningCardIcon}>📚</span>
                    <div className={styles.learningCardBody}>
                      <div className={styles.learningCardTitle}>SharePoint Essentials</div>
                      <div className={styles.learningCardMeta}>12 modules &middot; 2.5 hrs</div>
                      <div className={styles.learningCardBar}>
                        <div className={styles.learningCardProgress} />
                      </div>
                    </div>
                  </div>

                  <div className={styles.msg}>
                    <span className={styles.avatar} data-color="teal" />
                    <div className={styles.msgBody}>
                      <div className={styles.msgName} />
                      <div className={styles.msgLine} />
                      <div className={`${styles.msgLine} ${styles.msgLineShort}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating achievement chip */}
          <div className={styles.chip}>
            <span className={styles.chipIcon}>🏆</span>
            <span className={styles.chipText}>Path completed!</span>
          </div>
        </div>

      </div>
    </section>
  )
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
