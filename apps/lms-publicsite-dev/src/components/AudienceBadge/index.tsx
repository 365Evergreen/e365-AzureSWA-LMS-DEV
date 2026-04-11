import type { KBAudience } from '../../data/kb'
import styles from './AudienceBadge.module.css'

interface AudienceBadgeProps {
  audience: KBAudience
}

const LABELS: Record<KBAudience, string> = {
  editor: 'Editor',
  learner: 'Learner',
  both: 'All Audiences',
}

export function AudienceBadge({ audience }: AudienceBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[audience]}`}>
      {LABELS[audience]}
    </span>
  )
}