import { Card } from '@lms/shared-ui'
import styles from './FeatureGrid.module.css'

interface Feature {
  title: string
  description: string
  icon: string
}

const FEATURES: Feature[] = [
  {
    title: 'Block-based authoring',
    description: 'Compose learning experiences from modular, reusable blocks. Drag, drop, and publish with ease.',
    icon: '🧱',
  },
  {
    title: 'Static-first delivery',
    description: 'Pre-rendered content means blazing-fast load times and a seamless learner experience every time.',
    icon: '⚡',
  },
  {
    title: 'Evergreen platform',
    description: 'Automated review cycles and version tracking keep your content accurate and up to date.',
    icon: '🌱',
  },
]

export function FeatureGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Why LMS Platform?</h2>
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <Card key={feature.title} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">{feature.icon}</span>
              <h3 className={styles.title}>{feature.title}</h3>
              <p className={styles.description}>{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}