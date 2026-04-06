import styles from './VersionSelector.module.css'

interface VersionSelectorProps {
  value: 'current' | 'previous' | 'all'
  onChange: (v: 'current' | 'previous' | 'all') => void
}

const options: { label: string; value: VersionSelectorProps['value'] }[] = [
  { label: 'Current', value: 'current' },
  { label: 'Previous', value: 'previous' },
  { label: 'All', value: 'all' },
]

export function VersionSelector({ value, onChange }: VersionSelectorProps) {
  return (
    <div className={styles.group}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.btn} ${value === opt.value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
