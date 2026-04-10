import { useState, useEffect, useRef } from 'react';
import { listEditorCatalogueItems } from '../../api/catalogue';
import type { CatalogueItem } from '../../api/catalogue';
import styles from './CourseSelectorModal.module.css';

export interface SelectedCourse {
  itemId: string;
  slug: string;
  title: string;
}

interface CourseSelectorModalProps {
  onSelect: (course: SelectedCourse) => void;
  onClose: () => void;
  currentCourseId?: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  Beginner: '🟢 Beginner',
  Intermediate: '🟡 Intermediate',
  Advanced: '🔴 Advanced',
};

export default function CourseSelectorModal({ onSelect, onClose, currentCourseId }: CourseSelectorModalProps) {
  const [courses, setCourses] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listEditorCatalogueItems('PATH')
      .then((res) => setCourses(res.items))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // Auto-focus the filter input when modal opens
  useEffect(() => {
    filterRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const query = filter.toLowerCase().trim();
  const filtered = courses.filter((c) =>
    !query ||
    c.title.toLowerCase().includes(query) ||
    c.summary?.toLowerCase().includes(query) ||
    c.tagsCsv?.toLowerCase().includes(query)
  );

  function handleSelect(course: CatalogueItem) {
    onSelect({ itemId: course.itemId, slug: course.slug, title: course.title });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Select course">
        <div className={styles.header}>
          <h2 className={styles.title}>Select course</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.search}>
          <input
            ref={filterRef}
            className={styles.searchInput}
            type="text"
            placeholder="Filter by title, summary, or tag…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className={styles.body}>
          {loading && <p className={styles.state}>Loading courses…</p>}
          {error && <p className={styles.stateError}>{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p className={styles.state}>
              {query ? `No courses match "${filter}"` : 'No courses found.'}
            </p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <ul className={styles.list}>
              {filtered.map((course) => {
                const isSelected = course.itemId === currentCourseId;
                return (
                  <li key={course.itemId}>
                    <button
                      className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                      onClick={() => handleSelect(course)}
                    >
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt="" className={styles.thumb} />
                      ) : (
                        <div className={styles.thumbPlaceholder}>📚</div>
                      )}
                      <div className={styles.itemBody}>
                        <div className={styles.itemHeader}>
                          <span className={styles.itemTitle}>{course.title}</span>
                          <span className={`${styles.statusBadge} ${styles[course.status.toLowerCase()]}`}>
                            {course.status}
                          </span>
                        </div>
                        {course.summary && (
                          <span className={styles.itemSummary}>{course.summary}</span>
                        )}
                        <div className={styles.itemMeta}>
                          {course.difficulty && (
                            <span className={styles.metaTag}>{DIFFICULTY_LABEL[course.difficulty] ?? course.difficulty}</span>
                          )}
                          {course.estimatedMinutes > 0 && (
                            <span className={styles.metaTag}>
                              {course.estimatedMinutes >= 60
                                ? `${Math.round(course.estimatedMinutes / 60)}h`
                                : `${course.estimatedMinutes}m`}
                            </span>
                          )}
                          {course.tagsCsv && course.tagsCsv.split(',').filter(Boolean).slice(0, 3).map((t) => (
                            <span key={t} className={styles.metaTag}>{t.trim()}</span>
                          ))}
                        </div>
                      </div>
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
