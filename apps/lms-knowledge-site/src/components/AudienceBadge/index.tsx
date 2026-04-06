import styles from './AudienceBadge.module.css'

interface AudienceBadgeProps {
  audience: 'editor' | 'learner' | 'both'
}

const labels: Record<AudienceBadgeProps['audience'], string> = {
  editor: 'Editor',
  learner: 'Learner',
  both: 'Both',
}

export function AudienceBadge({ audience }: AudienceBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[audience]}`}>
      {labels[audience]}
    </span>
  )
}
