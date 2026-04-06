import { useState, useEffect } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search articles…' }: SearchBarProps) {
  const [raw, setRaw] = useState(value)
  const debounced = useDebounce(raw, 200)

  useEffect(() => {
    onChange(debounced)
  }, [debounced, onChange])

  return (
    <div className={styles.wrapper}>
      <svg className={styles.icon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        className={styles.input}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
