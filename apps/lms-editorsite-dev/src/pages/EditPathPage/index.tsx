import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import {
  loadEditorCatalogueItem,
  patchCatalogueItem,
  publishCatalogueItem,
  addModule,
  addUnit,
  removeModule,
  removeUnit,
} from '../../api/catalogue';
import type { CatalogueItem, PathDetail } from '../../api/catalogue';
import styles from './EditPathPage.module.css';

interface UnitRow extends CatalogueItem { sortOrder: number; isOptional: boolean; }
interface ModuleRow extends CatalogueItem { sortOrder: number; isOptional: boolean; units: UnitRow[]; }

export default function EditPathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();

  const [path, setPath] = useState<CatalogueItem | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Quick metadata edit
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<CatalogueItem['difficulty']>('Beginner');
  const [editMinutes, setEditMinutes] = useState(0);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!pathId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await loadEditorCatalogueItem('PATH', pathId) as PathDetail;
      setPath(detail);
      setEditTitle(detail.title);
      setEditSummary(detail.summary ?? '');
      setEditTags(detail.tagsCsv.split(',').filter(Boolean).join(', '));
      setEditDifficulty(detail.difficulty ?? 'Beginner');
      setEditMinutes(detail.estimatedMinutes ?? 0);

      const mods: ModuleRow[] = (detail.modules ?? []).map((m) => ({
        ...(m as ModuleRow),
        units: ((m as ModuleRow).units ?? []).map(u => ({ ...u } as UnitRow)),
      }));
      setModules(mods);
      setExpandedModules(new Set(mods.map(m => m.itemId)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [pathId]);

  useEffect(() => { load(); }, [load]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSaveMeta = async () => {
    if (!pathId) return;
    setMetaSaving(true);
    try {
      await patchCatalogueItem('PATH', pathId, {
        title: editTitle,
        summary: editSummary,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        difficulty: editDifficulty,
        estimatedMinutes: editMinutes,
      });
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 2000);
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setMetaSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!pathId || !confirm('Publish this course? It will be visible to learners.')) return;
    try {
      await publishCatalogueItem('PATH', pathId);
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleAddModule = async () => {
    if (!pathId) return;
    try {
      await addModule(pathId, 'New Module');
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleRemoveModule = async (moduleId: string) => {
    if (!pathId || !confirm('Remove this module? The module item will be archived.')) return;
    try {
      await removeModule(pathId, moduleId);
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleAddUnit = async (moduleId: string) => {
    try {
      await addUnit(moduleId, 'New Unit');
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleRemoveUnit = async (moduleId: string, unitId: string) => {
    if (!confirm('Remove this unit?')) return;
    try {
      await removeUnit(moduleId, unitId);
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const statusColors: Record<string, string> = {
    Draft: '#9ca3af',
    Published: '#10b981',
    Archived: '#f87171',
  };

  if (loading) {
    return (
      <div className={styles.page}><AppNav />
        <div className={styles.loading}>Loading course…</div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className={styles.page}><AppNav />
        <div className={styles.error}>{error ?? 'Course not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/courses')}>← Courses</button>
        <h1 className={styles.pageTitle}>{path.title}</h1>
        <div className={styles.topBarActions}>
          {actionError && <span className={styles.saveError}>{actionError}</span>}
          {path.status === 'Draft' && (
            <Button onClick={handlePublish}>Publish Course</Button>
          )}
          {path.status === 'Published' && (
            <span className={styles.publishedBadge}>✓ Published</span>
          )}
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Left: Metadata ── */}
        <aside className={styles.metaPanel}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Course details</h2>

            <div className={styles.field}>
              <label className={styles.label}>Title</label>
              <input className={styles.input} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Summary</label>
              <textarea className={styles.textarea} value={editSummary} onChange={e => setEditSummary(e.target.value)} rows={3} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Difficulty</label>
              <select className={styles.select} value={editDifficulty} onChange={e => setEditDifficulty(e.target.value as CatalogueItem['difficulty'])}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Duration (minutes)</label>
              <input className={styles.input} type="number" min={0} value={editMinutes} onChange={e => setEditMinutes(parseInt(e.target.value) || 0)} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tags</label>
              <input className={styles.input} value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="comma-separated" />
            </div>

            <Button onClick={handleSaveMeta} disabled={metaSaving}>
              {metaSaving ? 'Saving…' : metaSaved ? '✓ Saved' : 'Save details'}
            </Button>
          </section>
        </aside>

        {/* ── Right: Structure ── */}
        <main className={styles.structurePanel}>
          <div className={styles.structureHeader}>
            <h2 className={styles.sectionTitle}>Course structure</h2>
            <Button onClick={handleAddModule}>+ Add Module</Button>
          </div>

          {modules.length === 0 && (
            <div className={styles.emptyStructure}>
              <p>No modules yet. Add a module to build the structure.</p>
            </div>
          )}

          <div className={styles.moduleList}>
            {modules.map((mod, mi) => (
              <div key={mod.itemId} className={styles.moduleCard}>
                <div className={styles.moduleHeader}>
                  <button className={styles.expandBtn} onClick={() => toggleModule(mod.itemId)}>
                    {expandedModules.has(mod.itemId) ? '▼' : '▶'}
                  </button>
                  <span className={styles.moduleIndex}>M{mi + 1}</span>
                  <span className={styles.moduleTitle}>{mod.title}</span>
                  <span className={styles.statusDot} style={{ background: statusColors[mod.status] }} title={mod.status} />
                  <span className={styles.unitCount}>{mod.units.length} unit{mod.units.length !== 1 ? 's' : ''}</span>
                  <button className={styles.removeBtn} onClick={() => handleRemoveModule(mod.itemId)} title="Remove module">✕</button>
                </div>

                {expandedModules.has(mod.itemId) && (
                  <div className={styles.unitList}>
                    {mod.units.map((unit, ui) => (
                      <div key={unit.itemId} className={styles.unitRow}>
                        <span className={styles.unitIndex}>{mi + 1}.{ui + 1}</span>
                        <span className={styles.unitTitle}>{unit.title}</span>
                        <span className={styles.unitType}>{unit.unitType ?? 'Lesson'}</span>
                        <span className={styles.statusDot} style={{ background: statusColors[unit.status] }} title={unit.status} />
                        {unit.status !== 'Published' && (
                          <button
                            className={styles.editUnitBtn}
                            onClick={() => navigate(`/courses/units/${unit.itemId}/edit`)}
                          >
                            Edit content
                          </button>
                        )}
                        {unit.status === 'Published' && (
                          <span className={styles.publishedUnit}>✓ Published</span>
                        )}
                        <button className={styles.removeBtn} onClick={() => handleRemoveUnit(mod.itemId, unit.itemId)} title="Remove unit">✕</button>
                      </div>
                    ))}
                    <button className={styles.addUnitBtn} onClick={() => handleAddUnit(mod.itemId)}>
                      + Add Unit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
