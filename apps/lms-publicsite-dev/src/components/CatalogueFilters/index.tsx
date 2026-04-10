import styles from './CatalogueFilters.module.css'

interface CatalogueFiltersProps {
  role: string
  level: string
  courseType: string
  onRoleChange: (v: string) => void
  onLevelChange: (v: string) => void
  onCourseTypeChange: (v: string) => void
  onReset: () => void
}

export function CatalogueFilters({
  role,
  level,
  courseType,
  onRoleChange,
  onLevelChange,
  onCourseTypeChange,
  onReset,
}: CatalogueFiltersProps) {
  const hasFilters = !!(role || level || courseType)

  return (
    <div className={styles.filters} role="search" aria-label="Filter courses">
      <span className={styles.label}>Filter:</span>

      <select
        className={styles.select}
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        aria-label="Role"
      >
        <option value="">All roles</option>
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

      <select
        className={styles.select}
        value={courseType}
        onChange={(e) => onCourseTypeChange(e.target.value)}
        aria-label="Course type"
      >
        <option value="">All types</option>
        <option value="compliance">Compliance</option>
        <option value="technical">Technical</option>
        <option value="leadership">Leadership</option>
        <option value="onboarding">Onboarding</option>
        <option value="soft-skills">Soft skills</option>
      </select>

      {hasFilters && (
        <button type="button" className={styles.resetButton} onClick={onReset}>
          Clear filters
        </button>
      )}
    </div>
  )
}
