import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import StatusBadge from '../../components/StatusBadge';
import {
  listEditorCatalogueItems,
  patchCatalogueItem,
  publishCatalogueItem,
  archiveCatalogueItem,
} from '../../api/catalogue';
import type { CatalogueItem } from '../../api/catalogue';
import styles from './CoursesPage.module.css';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'Draft' | 'Published' | 'Archived';

const DIFFICULTY_LABELS: Record<string, string> = {
  Foundation: '🔵 Foundation',
  Beginner: '🟢 Beginner',
  Intermediate: '🟡 Intermediate',
  Advanced: '🔴 Advanced',
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [drawerPath, setDrawerPath] = useState<CatalogueItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Quick-edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listEditorCatalogueItems('PATH');
      setPaths(res.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDrawer = (path: CatalogueItem) => {
    setDrawerPath(path);
    setEditTitle(path.title);
    setEditSummary(path.summary);
    setEditTags(path.tagsCsv.split(',').filter(Boolean).join(', '));
  };

  const closeDrawer = () => setDrawerPath(null);

  const handleQuickSave = async () => {
    if (!drawerPath) return;
    setSaving(true);
    try {
      await patchCatalogueItem('PATH', drawerPath.itemId, {
        title: editTitle,
        summary: editSummary,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      await load();
      closeDrawer();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (path: CatalogueItem) => {
    if (!confirm(`Publish "${path.title}"?`)) return;
    try {
      await publishCatalogueItem('PATH', path.itemId);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleArchive = async (path: CatalogueItem) => {
    if (!confirm(`Archive "${path.title}"? It will be hidden from learners.`)) return;
    try {
      await archiveCatalogueItem('PATH', path.itemId);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const filtered = statusFilter === 'all'
    ? paths
    : paths.filter(p => p.status === statusFilter);

  const unitCount = (path: CatalogueItem) =>
    path.estimatedMinutes > 0 ? `${path.estimatedMinutes} min` : null;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Courses</h1>
          <div className={styles.headerRight}>
            {/* Status filter */}
            <div className={styles.filterGroup}>
              {(['all', 'Draft', 'Published', 'Archived'] as const).map(s => (
                <button
                  key={s}
                  className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${view === 'grid' ? styles.toggleActive : ''}`}
                onClick={() => setView('grid')}
                title="Grid view"
              >⊞</button>
              <button
                className={`${styles.toggleBtn} ${view === 'list' ? styles.toggleActive : ''}`}
                onClick={() => setView('list')}
                title="List view"
              >≡</button>
            </div>

            <Button onClick={() => navigate('/courses/new')}>+ New Course</Button>
          </div>
        </div>

        {loading && <p className={styles.empty}>Loading…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className={styles.empty}>No courses found. Create one to get started.</p>
        )}

        {/* Grid view */}
        {!loading && view === 'grid' && (
          <div className={styles.grid}>
            {filtered.map(path => (
              <div key={path.itemId} className={styles.card} onClick={() => navigate(`/courses/edit/${path.itemId}`)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(`/courses/edit/${path.itemId}`)}>
                {path.thumbnailUrl ? (
                  <img src={path.thumbnailUrl} alt={path.title} className={styles.cardThumb} />
                ) : (
                  <div className={styles.cardThumbPlaceholder}>📚</div>
                )}
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <StatusBadge status={path.status.toLowerCase() as 'draft' | 'published'} />
                    {path.difficulty && (
                      <span className={styles.diffBadge}>{DIFFICULTY_LABELS[path.difficulty] ?? path.difficulty}</span>
                    )}
                  </div>
                  <h3 className={styles.cardTitle}>{path.title}</h3>
                  {path.summary && <p className={styles.cardSummary}>{path.summary}</p>}
                  <div className={styles.cardStats}>
                    {unitCount(path) && <span>{unitCount(path)}</span>}
                    {path.tagsCsv && (
                      <span className={styles.tagList}>
                        {path.tagsCsv.split(',').filter(Boolean).slice(0, 3).map(t => (
                          <span key={t} className={styles.tag}>{t}</span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                    <button className={styles.actionBtn} onClick={() => navigate(`/courses/edit/${path.itemId}`)}>
                      Edit
                    </button>
                    <button className={styles.actionBtnSecondary} onClick={() => openDrawer(path)}>
                      Quick edit
                    </button>
                    {path.status === 'Draft' && (
                      <button className={styles.actionBtnSecondary} onClick={() => handlePublish(path)}>
                        Publish
                      </button>
                    )}
                    {path.status === 'Published' && (
                      <button className={styles.actionBtnSecondary} onClick={() => handleArchive(path)}>
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && view === 'list' && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(path => (
                <tr key={path.itemId} className={styles.tableRow} onClick={() => navigate(`/courses/edit/${path.itemId}`)}>
                  <td>
                    <span className={styles.tableTitle}>{path.title}</span>
                    {path.summary && <span className={styles.tableSummary}>{path.summary}</span>}
                  </td>
                  <td>{path.difficulty ?? '—'}</td>
                  <td>{path.estimatedMinutes ? `${path.estimatedMinutes} min` : '—'}</td>
                  <td><StatusBadge status={path.status.toLowerCase() as 'draft' | 'published'} /></td>
                  <td>{path.updatedOn ? new Date(path.updatedOn).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className={styles.tableActions} onClick={e => e.stopPropagation()}>
                      <button className={styles.actionBtn} onClick={() => navigate(`/courses/edit/${path.itemId}`)}>Edit</button>
                      <button className={styles.actionBtnSecondary} onClick={() => openDrawer(path)}>Quick edit</button>
                      {path.status === 'Draft' && (
                        <button className={styles.actionBtnSecondary} onClick={() => handlePublish(path)}>Publish</button>
                      )}
                      {path.status === 'Published' && (
                        <button className={styles.actionBtnSecondary} onClick={() => handleArchive(path)}>Archive</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Quick-edit drawer */}
      {drawerPath && (
        <div className={styles.drawerOverlay} onClick={closeDrawer}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>Quick edit</h2>
              <button className={styles.drawerClose} onClick={closeDrawer}>✕</button>
            </div>
            <div className={styles.drawerBody}>
              <label className={styles.fieldLabel}>Title</label>
              <input
                className={styles.fieldInput}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />

              <label className={styles.fieldLabel}>Summary</label>
              <textarea
                className={styles.fieldTextarea}
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                rows={3}
              />

              <label className={styles.fieldLabel}>Tags (comma-separated)</label>
              <input
                className={styles.fieldInput}
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                placeholder="react, typescript, beginner"
              />
            </div>
            <div className={styles.drawerFooter}>
              <Button onClick={handleQuickSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <button className={styles.cancelBtn} onClick={closeDrawer}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
