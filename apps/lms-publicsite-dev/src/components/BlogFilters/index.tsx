import styles from './BlogFilters.module.css'

interface BlogFiltersProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onReset: () => void
}

export function BlogFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  onReset,
}: BlogFiltersProps) {
  return (
    <div className={styles.filters} role="search" aria-label="Filter posts">
      <span className={styles.label}>Category:</span>
      <div className={styles.pills}>
        <button
          type="button"
          className={`${styles.pill} ${!selectedCategory ? styles.pillActive : ''}`}
          onClick={onReset}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`${styles.pill} ${selectedCategory === cat ? styles.pillActive : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
