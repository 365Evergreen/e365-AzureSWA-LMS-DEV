import styles from './CatalogueFilters.module.css'

interface CatalogueFiltersProps {
  audience: string
  level: string
  onAudienceChange: (v: string) => void
  onLevelChange: (v: string) => void
  onReset: () => void
}

export function CatalogueFilters({
  audience,
  level,
  onAudienceChange,
  onLevelChange,
  onReset,
}: CatalogueFiltersProps) {
  return (
    <div className={styles.filters} role="search" aria-label="Filter courses">
      <span className={styles.label}>Filter:</span>

      <select
        className={styles.select}
        value={audience}
        onChange={(e) => onAudienceChange(e.target.value)}
        aria-label="Audience"
      >
        <option value="">All audiences</option>
        <option value="developer">Developer</option>
        <option value="manager">Manager</option>
        <option value="designer">Designer</option>
      </select>

      <select
        className={styles.select}
        value={level}
        onChange={(e) => onLevelChange(e.target.value)}
        aria-label="Level"
      >
        <option value="">All levels</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>

      {(audience || level) && (
        <button type="button" className={styles.resetButton} onClick={onReset}>
          Clear filters
        </button>
      )}
    </div>
  )
}
