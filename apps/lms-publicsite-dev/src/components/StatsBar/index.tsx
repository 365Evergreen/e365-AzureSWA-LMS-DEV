import styles from './StatsBar.module.css'

const STATS = [
  { value: 'Self-paced', label: 'Learn at your own speed' },
  { value: 'Role-based', label: 'Content matched to your role' },
  { value: 'On-demand', label: 'Available any time, anywhere' },
]

export function StatsBar() {
  return (
    <section className={styles.bar} aria-label="Platform highlights">
      <div className={styles.inner}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span className={styles.value}>{stat.value}</span>
            <span className={styles.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
