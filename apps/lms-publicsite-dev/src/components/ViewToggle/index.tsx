import styles from './ViewToggle.module.css'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
  </svg>
)

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="2" width="14" height="3" rx="1" fill="currentColor" />
    <rect x="1" y="6.5" width="14" height="3" rx="1" fill="currentColor" />
    <rect x="1" y="11" width="14" height="3" rx="1" fill="currentColor" />
  </svg>
)

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className={styles.toggle} role="group" aria-label="View mode">
      <button
        type="button"
        className={`${styles.btn} ${view === 'grid' ? styles.btnActive : ''}`}
        onClick={() => onViewChange('grid')}
        aria-pressed={view === 'grid'}
        title="Grid view"
      >
        <GridIcon />
        <span className={styles.label}>Grid</span>
      </button>
      <button
        type="button"
        className={`${styles.btn} ${view === 'list' ? styles.btnActive : ''}`}
        onClick={() => onViewChange('list')}
        aria-pressed={view === 'list'}
        title="List view"
      >
        <ListIcon />
        <span className={styles.label}>List</span>
      </button>
    </div>
  )
}
