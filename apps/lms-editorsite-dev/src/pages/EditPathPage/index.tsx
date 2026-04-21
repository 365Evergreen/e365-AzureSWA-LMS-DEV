import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import MediaPickerModal from '../../components/MediaPickerModal';
import PublishBar from '../../components/PublishBar';
import ModuleAssessmentModal from '../../components/ModuleAssessmentModal';
import type { MediaItem } from '../../api/media';
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
import { UnitEditorCanvas } from '../EditUnitPage';
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
  const [editSlug, setEditSlug] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<CatalogueItem['difficulty']>('Beginner');
  const [editRole, setEditRole] = useState('');
  const [editLearningPath, setEditLearningPath] = useState('');
  const [editIsMandatory, setEditIsMandatory] = useState(false);
  const [editLanguage, setEditLanguage] = useState('en');
  const [editVisibility, setEditVisibility] = useState<CatalogueItem['visibility']>('Public');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editIsCurrent, setEditIsCurrent] = useState(true);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  // Module details editing
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');
  const [editingModuleSlug, setEditingModuleSlug] = useState('');
  const [editingModuleSummary, setEditingModuleSummary] = useState('');
  const [editingModuleThumbnailUrl, setEditingModuleThumbnailUrl] = useState('');
  const [editingModuleIsCurrent, setEditingModuleIsCurrent] = useState(true);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [showCourseMediaPicker, setShowCourseMediaPicker] = useState(false);
  const [showModuleMediaPicker, setShowModuleMediaPicker] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingAssessmentModuleId, setEditingAssessmentModuleId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!pathId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await loadEditorCatalogueItem('PATH', pathId) as PathDetail;
      setPath(detail);
      setEditTitle(detail.title);
      setEditSlug(detail.slug ?? '');
      setEditSummary(detail.summary ?? '');
      setEditTags(detail.tagsCsv.split(',').filter(Boolean).join(', '));
      setEditDifficulty(detail.difficulty ?? 'Beginner');
      setEditRole(detail.role ?? '');
      setEditLearningPath(detail.learningPath ?? '');
      setEditIsMandatory(detail.isMandatory ?? false);
      setEditLanguage(detail.language ?? 'en');
      setEditVisibility(detail.visibility ?? 'Public');
      setEditThumbnailUrl(detail.thumbnailUrl ?? '');
      setEditIsCurrent(detail.status !== 'Archived');

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSaveMeta = async () => {
    if (!pathId || !path) return;
    setMetaSaving(true);
    const derivedMinutes = modules.reduce(
      (courseSum, mod) => courseSum + mod.units.reduce((moduleSum, unit) => moduleSum + (unit.estimatedMinutes ?? 0), 0),
      0
    );
    try {
      await patchCatalogueItem('PATH', pathId, {
        title: editTitle,
        slug: editSlug,
        summary: editSummary,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        difficulty: editDifficulty,
        role: editRole.trim() || undefined,
        learningPath: editLearningPath.trim() || undefined,
        estimatedMinutes: derivedMinutes,
        isMandatory: editIsMandatory,
        language: editLanguage,
        visibility: editVisibility,
        thumbnailUrl: editThumbnailUrl,
        status: editIsCurrent ? (path.status === 'Archived' ? 'Draft' : path.status) : 'Archived',
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

  const startEditingModule = (mod: ModuleRow) => {
    setEditingModuleId(mod.itemId);
    setEditingModuleTitle(mod.title);
    setEditingModuleSlug(mod.slug ?? '');
    setEditingModuleSummary(mod.summary ?? '');
    setEditingModuleThumbnailUrl(mod.thumbnailUrl ?? '');
    setEditingModuleIsCurrent(mod.status !== 'Archived');
  };

  const cancelEditingModule = () => {
    setEditingModuleId(null);
    setEditingModuleTitle('');
    setEditingModuleSlug('');
    setEditingModuleSummary('');
    setEditingModuleThumbnailUrl('');
    setEditingModuleIsCurrent(true);
    setShowModuleMediaPicker(false);
  };

  const handleSaveModule = async (mod: ModuleRow) => {
    await saveModuleWithStatus(mod, editingModuleIsCurrent ? 'Draft' : 'Archived');
  };

  const saveModuleWithStatus = async (
    mod: ModuleRow,
    status: CatalogueItem['status']
  ) => {
    const trimmed = editingModuleTitle.trim();
    if (!trimmed) return false;
    const derivedMinutes = mod.units.reduce((sum, unit) => sum + (unit.estimatedMinutes ?? 0), 0);
    setModuleSaving(true);
    setActionError(null);
    try {
      await patchCatalogueItem('MODULE', mod.itemId, {
        title: trimmed,
        slug: editingModuleSlug.trim(),
        summary: editingModuleSummary.trim(),
        thumbnailUrl: editingModuleThumbnailUrl.trim() || undefined,
        estimatedMinutes: derivedMinutes,
        status,
      });
      setEditingModuleId(null);
      await load();
      return true;
    } catch (err) {
      setActionError((err as Error).message);
      return false;
    } finally {
      setModuleSaving(false);
    }
  };

  const handleModulePublishBarSave = async (mod: ModuleRow, publishStatus: 'draft' | 'published') => {
    if (publishStatus === 'published') {
      if (!editingModuleIsCurrent) {
        setActionError('Archived modules cannot be published. Mark the module as current first.');
        return;
      }
      const saved = await saveModuleWithStatus(mod, 'Draft');
      if (!saved) return;
      try {
        await publishCatalogueItem('MODULE', mod.itemId);
        await load();
      } catch (err) {
        setActionError((err as Error).message);
      }
      return;
    }

    await saveModuleWithStatus(mod, editingModuleIsCurrent ? 'Draft' : 'Archived');
  };

  const handleAddUnit = async (moduleId: string) => {
    try {
      const created = await addUnit(moduleId, 'New Unit');
      setEditingUnitId(created.unit.itemId);
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

  const courseDuration = modules.reduce(
    (courseSum, mod) => courseSum + mod.units.reduce((moduleSum, unit) => moduleSum + (unit.estimatedMinutes ?? 0), 0),
    0
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading course…</div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error ?? 'Course not found'}</div>
      </div>
    );
  }

  const modalPathId = pathId ?? path.itemId;
  const editingAssessmentModule = modules.find((module) => module.itemId === editingAssessmentModuleId) ?? null;

  return (
    <div className={styles.page}>
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
              <label className={styles.label}>
                Slug
                <span className={styles.fieldHint}>Changing breaks existing links</span>
              </label>
              <input
                className={styles.input}
                value={editSlug}
                onChange={e => setEditSlug(e.target.value)}
                placeholder="intro-to-react"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Summary</label>
              <textarea className={styles.textarea} value={editSummary} onChange={e => setEditSummary(e.target.value)} rows={3} maxLength={1000} />
              <span className={styles.fieldHint}>{editSummary.length}/1000 characters</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Level</label>
              <select className={styles.select} value={editDifficulty} onChange={e => setEditDifficulty(e.target.value as CatalogueItem['difficulty'])}>
                <option value="Foundation">Foundation</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Role</label>
              <input
                className={styles.input}
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                placeholder="Optional target role"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Learning path</label>
              <input
                className={styles.input}
                value={editLearningPath}
                onChange={e => setEditLearningPath(e.target.value)}
                placeholder="Optional learning path"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Duration (minutes)</label>
              <input className={styles.input} type="number" min={0} value={courseDuration} readOnly />
              <span className={styles.fieldHint}>Auto-calculated from module and unit durations</span>
            </div>

            <div className={styles.field}>
              <label className={styles.currentToggle}>
                <input type="checkbox" checked={editIsMandatory} onChange={e => setEditIsMandatory(e.target.checked)} />
                <span>Mandatory course</span>
              </label>
              <span className={styles.fieldHint}>Mandatory courses remain in learner course lists until completed.</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Language</label>
              <select className={styles.select} value={editLanguage} onChange={e => setEditLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Visibility</label>
              <select className={styles.select} value={editVisibility} onChange={e => setEditVisibility(e.target.value as CatalogueItem['visibility'])}>
                <option value="Public">Public</option>
                <option value="Enrolled">Enrolled learners only</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tags</label>
              <input className={styles.input} value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="comma-separated" />
            </div>

                         <div className={styles.field}>
                          <label className={styles.label}>Featured image</label>
              <div className={styles.mediaActions}>
                <button type="button" className={styles.mediaBtn} onClick={() => setShowCourseMediaPicker(true)}>
                  Select from library
                </button>
                <button
                  type="button"
                  className={styles.mediaBtnSecondary}
                  onClick={() => setEditThumbnailUrl('')}
                  disabled={!editThumbnailUrl}
                >
                  Clear
                </button>
              </div>
              <span className={styles.fieldHint}>Displayed on catalogue card</span>
              {editThumbnailUrl && (
                <img
                  src={editThumbnailUrl}
                  alt="Featured"
                  className={styles.imagePreview}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.currentToggle}>
                <input type="checkbox" checked={editIsCurrent} onChange={e => setEditIsCurrent(e.target.checked)} />
                <span>Current</span>
              </label>
              <span className={styles.fieldHint}>Archived courses remain available to editors only.</span>
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

                  {editingModuleId === mod.itemId ? (
                    <span className={styles.moduleTitle}>{mod.title}</span>
                  ) : (
                    <span className={styles.moduleTitle}>{mod.title}</span>
                  )}

                  <span className={styles.statusDot} style={{ background: statusColors[mod.status] }} title={mod.status} />
                  <span className={styles.unitCount}>{mod.units.length} unit{mod.units.length !== 1 ? 's' : ''}</span>

                  {editingModuleId === mod.itemId ? (
                    <>
                      <button
                        className={styles.renameSaveBtn}
                        onClick={() => handleSaveModule(mod)}
                        disabled={moduleSaving}
                        title="Save details"
                      >✓</button>
                      <button className={styles.renameCancelBtn} onClick={cancelEditingModule} title="Cancel">✕</button>
                    </>
                  ) : (
                    <button
                      className={styles.editModuleBtn}
                      onClick={() => startEditingModule(mod)}
                      title="Edit module details"
                    >Edit</button>
                  )}

                  <button className={styles.removeBtn} onClick={() => handleRemoveModule(mod.itemId)} title="Remove module">✕</button>
                </div>

                {expandedModules.has(mod.itemId) && (
                  <div className={styles.unitList}>
                    {editingModuleId === mod.itemId && (
                      <div className={styles.moduleDetails}>
                        <div className={styles.field}>
                          <label className={styles.label}>Title</label>
                          <input className={styles.input} value={editingModuleTitle} onChange={e => setEditingModuleTitle(e.target.value)} autoFocus />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Slug</label>
                          <input className={styles.input} value={editingModuleSlug} onChange={e => setEditingModuleSlug(e.target.value)} />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Summary</label>
                          <textarea
                            className={styles.textarea}
                            value={editingModuleSummary}
                            onChange={e => setEditingModuleSummary(e.target.value)}
                            rows={3}
                            maxLength={1000}
                          />
                          <span className={styles.fieldHint}>{editingModuleSummary.length}/1000 characters</span>
                        </div>

                        <div className={styles.moduleMetaRow}>
                          <div className={styles.field}>
                            <label className={styles.label}>Duration (minutes)</label>
                            <input
                              className={styles.input}
                              value={mod.units.reduce((sum, unit) => sum + (unit.estimatedMinutes ?? 0), 0)}
                              readOnly
                            />
                          </div>

                          <div className={styles.field}>
                            <label className={styles.currentToggle}>
                              <input
                                type="checkbox"
                                checked={editingModuleIsCurrent}
                                onChange={e => setEditingModuleIsCurrent(e.target.checked)}
                              />
                              <span>Current</span>
                            </label>
                          </div>
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Featured image</label>
                          <div className={styles.mediaActions}>
                            <button type="button" className={styles.mediaBtn} onClick={() => setShowModuleMediaPicker(true)}>
                              Select from library
                            </button>
                            <button
                              type="button"
                              className={styles.mediaBtnSecondary}
                              onClick={() => setEditingModuleThumbnailUrl('')}
                              disabled={!editingModuleThumbnailUrl}
                            >
                              Clear
                            </button>
                          </div>
                          {editingModuleThumbnailUrl && (
                            <img
                              src={editingModuleThumbnailUrl}
                              alt={`${mod.title} featured`}
                              className={styles.imagePreview}
                            />
                          )}
                        </div>

                        <div className={styles.modulePublishBar}>
                          <PublishBar
                            itemLabel="module"
                            status={mod.status === 'Published' ? 'published' : 'draft'}
                            onSave={(status) => handleModulePublishBarSave(mod, status)}
                            onDiscard={cancelEditingModule}
                          />
                        </div>
                      </div>
                    )}

                    {mod.units.map((unit, ui) => (
                      <div key={unit.itemId} className={styles.unitRow}>
                        <span className={styles.unitIndex}>{mi + 1}.{ui + 1}</span>
                        <span className={styles.unitTitle}>{unit.title}</span>
                        <span className={styles.unitType}>{unit.unitType ?? 'Lesson'}</span>
                        <span className={styles.statusDot} style={{ background: statusColors[unit.status] }} title={unit.status} />
                        <button
                          className={styles.editUnitBtn}
                          onClick={() => setEditingUnitId(unit.itemId)}
                        >
                          Edit unit
                        </button>
                        {unit.status === 'Published' && (
                          <span className={styles.publishedUnit}>✓ Published</span>
                        )}
                        <button className={styles.removeBtn} onClick={() => handleRemoveUnit(mod.itemId, unit.itemId)} title="Remove unit">✕</button>
                      </div>
                    ))}
                    <div className={styles.moduleActions}>
                      <button
                        className={styles.editAssessmentBtn}
                        onClick={() => setEditingAssessmentModuleId(mod.itemId)}
                      >
                        Edit assessment
                      </button>
                    </div>
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

      <MediaPickerModal
        isOpen={showCourseMediaPicker}
        onClose={() => setShowCourseMediaPicker(false)}
        onSelect={(item: MediaItem) => setEditThumbnailUrl(item.url)}
        filter="image"
        title="Select course image"
      />

      <MediaPickerModal
        isOpen={showModuleMediaPicker}
        onClose={() => setShowModuleMediaPicker(false)}
        onSelect={(item: MediaItem) => setEditingModuleThumbnailUrl(item.url)}
        filter="image"
        title="Select module image"
      />

      {editingUnitId && (
        <div className={styles.unitModalOverlay} role="dialog" aria-modal="true" aria-label="Edit unit">
          <div className={styles.unitModalContent}>
            <UnitEditorCanvas
              unitId={editingUnitId}
              pathId={modalPathId}
              onClose={() => {
                setEditingUnitId(null);
                void load();
              }}
            />
          </div>
        </div>
      )}

      <ModuleAssessmentModal
        isOpen={editingAssessmentModule !== null}
        moduleId={editingAssessmentModule?.itemId ?? null}
        moduleTitle={editingAssessmentModule?.title}
        onClose={() => setEditingAssessmentModuleId(null)}
        onSaved={() => {
          void load();
        }}
      />
    </div>
  );
}

