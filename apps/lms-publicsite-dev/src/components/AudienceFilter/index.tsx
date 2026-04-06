import styles from './AudienceFilter.module.css'

export type AudienceFilterValue = 'all' | 'editor' | 'learner'

interface AudienceFilterProps {
  value: AudienceFilterValue
  onChange: (value: AudienceFilterValue) => void
}

const OPTIONS: { value: AudienceFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'editor', label: 'Editor' },
  { value: 'learner', label: 'Learner' },
]

export function AudienceFilter({ value, onChange }: AudienceFilterProps) {
  return (
    <div className={styles.filter} role="tablist" aria-label="Filter by audience">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          className={`${styles.tab} ${value === opt.value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}