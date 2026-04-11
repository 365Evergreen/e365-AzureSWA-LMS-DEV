import type { KBVersion } from '../../data/kb'
import styles from './VersionBadge.module.css'

interface VersionBadgeProps {
  version: KBVersion
}

const LABELS: Record<KBVersion, string> = {
  current: 'Current',
  previous: 'Previous',
}

export function VersionBadge({ version }: VersionBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[version]}`}>
      {LABELS[version]}
    </span>
  )
}