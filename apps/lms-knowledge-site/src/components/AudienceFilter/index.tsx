import styles from './AudienceFilter.module.css'

interface AudienceFilterProps {
  value: 'all' | 'editor' | 'learner'
  onChange: (v: 'all' | 'editor' | 'learner') => void
}

const options: { label: string; value: AudienceFilterProps['value'] }[] = [
  { label: 'All', value: 'all' },
  { label: 'Editor', value: 'editor' },
  { label: 'Learner', value: 'learner' },
]

export function AudienceFilter({ value, onChange }: AudienceFilterProps) {
  return (
    <div className={styles.tabs}>
      {options.map(opt => (
        <button
          key={opt.value}
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
