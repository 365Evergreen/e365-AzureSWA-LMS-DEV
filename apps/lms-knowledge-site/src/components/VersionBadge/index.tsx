import styles from './VersionBadge.module.css'

interface VersionBadgeProps {
  version: 'current' | 'previous'
}

const labels: Record<VersionBadgeProps['version'], string> = {
  current: 'Current',
  previous: 'Previous',
}

export function VersionBadge({ version }: VersionBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[version]}`}>
      {labels[version]}
    </span>
  )
}
