import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import { createPath, addModule, addUnit, patchCatalogueItem } from '../../api/catalogue';
import MediaPickerModal from '../../components/MediaPickerModal';
import type { MediaItem } from '../../api/media';
import type { CatalogueItem } from '../../api/catalogue';
import styles from './AddNewCoursePage.module.css';

interface UnitStub { id: string; title: string; unitType: CatalogueItem['unitType']; estimatedMinutes: number; }
interface ModuleStub {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl: string;
  isCurrent: boolean;
  units: UnitStub[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AddNewCoursePage() {
  const navigate = useNavigate();

  // Metadata
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState('');
  const [difficulty, setDifficulty] = useState<CatalogueItem['difficulty']>('Foundation');
  const [role, setRole] = useState('');
  const [learningPath, setLearningPath] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('en');
  const [visibility, setVisibility] = useState<CatalogueItem['visibility']>('Public');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);
  const [showCourseMediaPicker, setShowCourseMediaPicker] = useState(false);
  const [moduleMediaPickerId, setModuleMediaPickerId] = useState<string | null>(null);

  // Structure (optimistic local state — created in backend after save)
  const [modules, setModules] = useState<ModuleStub[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Metadata helpers ───────────────────────────────────────────

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) setSlug(slugify(val));
  };

  // ── Module / unit helpers (local only until Save) ──────────────

  const addLocalModule = () => {
    const id = `local-${Date.now()}`;
    setModules(prev => [...prev, {
      id,
      title: 'New Module',
      slug: 'new-module',
      summary: '',
      thumbnailUrl: '',
      isCurrent: true,
      units: [],
    }]);
    setExpandedModules(prev => new Set([...prev, id]));
  };

  const updateModuleTitle = (id: string, val: string) => {
    setModules(prev => prev.map((m) => {
      if (m.id !== id) return m;
      const nextSlug = !m.slug || m.slug === slugify(m.title) ? slugify(val) : m.slug;
      return { ...m, title: val, slug: nextSlug };
    }));
  };

  const updateModuleMeta = (id: string, patch: Partial<ModuleStub>) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const removeLocalModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const addLocalUnit = (moduleId: string) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, units: [...m.units, { id: `local-unit-${Date.now()}`, title: 'New Unit', unitType: 'Lesson', estimatedMinutes: 0 }] }
          : m
      )
    );
  };

  const updateUnitTitle = (moduleId: string, unitId: string, val: string) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, units: m.units.map(u => u.id === unitId ? { ...u, title: val } : u) }
          : m
      )
    );
  };

  const updateUnitType = (moduleId: string, unitId: string, val: CatalogueItem['unitType']) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, units: m.units.map(u => u.id === unitId ? { ...u, unitType: val } : u) }
          : m
      )
    );
  };

  const updateUnitMinutes = (moduleId: string, unitId: string, val: number) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, units: m.units.map(u => u.id === unitId ? { ...u, estimatedMinutes: val } : u) }
          : m
      )
    );
  };

  const removeLocalUnit = (moduleId: string, unitId: string) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId ? { ...m, units: m.units.filter(u => u.id !== unitId) } : m
      )
    );
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getModuleMinutes = (module: ModuleStub) =>
    module.units.reduce((sum, unit) => sum + (unit.estimatedMinutes || 0), 0);

  const estimatedMinutes = modules.reduce((sum, module) => sum + getModuleMinutes(module), 0);

  // ── Save ───────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) { setSaveError('Title is required'); return; }
    if (!slug.trim()) { setSaveError('Slug is required'); return; }

    setSaving(true);
    setSaveError(null);

    try {
      // 1. Create the path
      const path = await createPath({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        difficulty,
        role: role.trim() || undefined,
        learningPath: learningPath.trim() || undefined,
        estimatedMinutes,
        visibility,
        language,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      if (!isCurrent) {
        await patchCatalogueItem('PATH', path.itemId, { status: 'Archived' });
      }

      // 2. Create modules and units sequentially to preserve order
      for (const mod of modules) {
        const { module } = await addModule(path.itemId, mod.title);
        let moduleMinutes = 0;
        for (const unit of mod.units) {
          const createdUnit = await addUnit(module.itemId, unit.title, unit.unitType ?? 'Lesson');
          moduleMinutes += unit.estimatedMinutes || 0;
          await patchCatalogueItem('UNIT', createdUnit.unit.itemId, {
            estimatedMinutes: unit.estimatedMinutes || 0,
          });
        }
        await patchCatalogueItem('MODULE', module.itemId, {
          slug: mod.slug.trim() || slugify(mod.title),
          summary: mod.summary.trim(),
          thumbnailUrl: mod.thumbnailUrl.trim() || undefined,
          estimatedMinutes: moduleMinutes,
          status: mod.isCurrent ? 'Draft' : 'Archived',
        });
      }

      await patchCatalogueItem('PATH', path.itemId, {
        estimatedMinutes,
      });

      navigate(`/courses/edit/${path.itemId}`);
    } catch (err) {
      setSaveError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/courses')}>← Courses</button>
        <h1 className={styles.pageTitle}>New Course</h1>
        <div className={styles.topBarActions}>
          {saveError && <span className={styles.saveError}>{saveError}</span>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save as Draft'}
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Left: Metadata ── */}
        <aside className={styles.metaPanel}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Course details</h2>

            <div className={styles.field}>
              <label className={styles.label}>Title <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Introduction to React"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Slug <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugTouched(true); }}
                placeholder="intro-to-react"
              />
              <span className={styles.hint}>Used in URLs. Lowercase letters, numbers, hyphens.</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Summary</label>
              <textarea
                className={styles.textarea}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="A brief description shown in the course catalogue…"
              />
              <span className={styles.hint}>{summary.length}/1000 characters</span>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Properties</h2>

            <div className={styles.field}>
              <label className={styles.label}>Level</label>
              <select className={styles.select} value={difficulty} onChange={e => setDifficulty(e.target.value as CatalogueItem['difficulty'])}>
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
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="Optional target role"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Learning path</label>
              <input
                className={styles.input}
                value={learningPath}
                onChange={e => setLearningPath(e.target.value)}
                placeholder="Optional learning path"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Estimated duration (minutes)</label>
              <input
                className={styles.input}
                type="number"
                value={estimatedMinutes}
                readOnly
              />
              <span className={styles.hint}>Auto-calculated from unit durations</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Language</label>
              <select className={styles.select} value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Visibility</label>
              <select className={styles.select} value={visibility} onChange={e => setVisibility(e.target.value as CatalogueItem['visibility'])}>
                <option value="Public">Public</option>
                <option value="Enrolled">Enrolled learners only</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tags</label>
              <input
                className={styles.input}
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="react, typescript, beginner"
              />
              <span className={styles.hint}>Comma-separated</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Featured image URL</label>
              <div className={styles.mediaActions}>
                <button type="button" className={styles.mediaBtn} onClick={() => setShowCourseMediaPicker(true)}>
                  Select from library
                </button>
                <button type="button" className={styles.mediaBtnSecondary} onClick={() => setThumbnailUrl('')} disabled={!thumbnailUrl}>
                  Clear
                </button>
              </div>
              <span className={styles.hint}>Displayed on catalogue card</span>
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Featured"
                  className={styles.imagePreview}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.currentToggle}>
                <input type="checkbox" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} />
                <span>Current</span>
              </label>
              <span className={styles.hint}>Off means editors can still access it, but learners and public visitors cannot.</span>
            </div>
          </section>
        </aside>

        {/* ── Right: Structure ── */}
        <main className={styles.structurePanel}>
          <div className={styles.structureHeader}>
            <h2 className={styles.sectionTitle}>Course structure</h2>
            <Button onClick={addLocalModule}>+ Add Module</Button>
          </div>

          {modules.length === 0 && (
            <div className={styles.emptyStructure}>
              <p>No modules yet.</p>
              <p>Add a module to start building your course structure.</p>
            </div>
          )}

          <div className={styles.moduleList}>
            {modules.map((mod, mi) => (
              <div key={mod.id} className={styles.moduleCard}>
                <div className={styles.moduleHeader}>
                  <button
                    className={styles.expandBtn}
                    onClick={() => toggleModule(mod.id)}
                    title={expandedModules.has(mod.id) ? 'Collapse' : 'Expand'}
                  >
                    {expandedModules.has(mod.id) ? '▼' : '▶'}
                  </button>
                  <span className={styles.moduleIndex}>M{mi + 1}</span>
                  <input
                    className={styles.inlineInput}
                    value={mod.title}
                    onChange={e => updateModuleTitle(mod.id, e.target.value)}
                    placeholder="Module title"
                  />
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeLocalModule(mod.id)}
                    title="Remove module"
                  >✕</button>
                </div>

                {expandedModules.has(mod.id) && (
                  <div className={styles.unitList}>
                    <div className={styles.moduleDetails}>
                      <div className={styles.field}>
                        <label className={styles.label}>Module slug</label>
                        <input
                          className={styles.input}
                          value={mod.slug}
                          onChange={e => updateModuleMeta(mod.id, { slug: e.target.value })}
                          placeholder="module-slug"
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>Summary</label>
                        <textarea
                          className={styles.textarea}
                          value={mod.summary}
                          onChange={e => updateModuleMeta(mod.id, { summary: e.target.value })}
                          rows={3}
                          maxLength={1000}
                        />
                        <span className={styles.hint}>{mod.summary.length}/1000 characters</span>
                      </div>

                      <div className={styles.moduleMetaRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>Duration (minutes)</label>
                          <input className={styles.input} value={getModuleMinutes(mod)} readOnly />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.currentToggle}>
                            <input
                              type="checkbox"
                              checked={mod.isCurrent}
                              onChange={e => updateModuleMeta(mod.id, { isCurrent: e.target.checked })}
                            />
                            <span>Current</span>
                          </label>
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>Featured image</label>
                        <div className={styles.mediaActions}>
                          <button type="button" className={styles.mediaBtn} onClick={() => setModuleMediaPickerId(mod.id)}>
                            Select from library
                          </button>
                          <button
                            type="button"
                            className={styles.mediaBtnSecondary}
                            onClick={() => updateModuleMeta(mod.id, { thumbnailUrl: '' })}
                            disabled={!mod.thumbnailUrl}
                          >
                            Clear
                          </button>
                        </div>
                        {mod.thumbnailUrl && (
                          <img
                            src={mod.thumbnailUrl}
                            alt={`${mod.title} featured`}
                            className={styles.imagePreview}
                          />
                        )}
                      </div>
                    </div>

                    {mod.units.map((unit, ui) => (
                      <div key={unit.id} className={styles.unitRow}>
                        <span className={styles.unitIndex}>{mi + 1}.{ui + 1}</span>
                        <input
                          className={styles.inlineInput}
                          value={unit.title}
                          onChange={e => updateUnitTitle(mod.id, unit.id, e.target.value)}
                          placeholder="Unit title"
                        />
                        <select
                          className={styles.unitTypeSelect}
                          value={unit.unitType ?? 'Lesson'}
                          onChange={e => updateUnitType(mod.id, unit.id, e.target.value as CatalogueItem['unitType'])}
                        >
                          <option value="Lesson">Lesson</option>
                          <option value="Video">Video</option>
                          <option value="Assessment">Assessment</option>
                          <option value="Interactive">Interactive</option>
                        </select>
                        <input
                          className={styles.unitMinutesInput}
                          type="number"
                          min={0}
                          value={unit.estimatedMinutes}
                          onChange={e => updateUnitMinutes(mod.id, unit.id, parseInt(e.target.value, 10) || 0)}
                          aria-label="Unit duration in minutes"
                        />
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeLocalUnit(mod.id, unit.id)}
                          title="Remove unit"
                        >✕</button>
                      </div>
                    ))}
                    <button
                      className={styles.addUnitBtn}
                      onClick={() => addLocalUnit(mod.id)}
                    >
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
        onSelect={(item: MediaItem) => setThumbnailUrl(item.url)}
        filter="image"
        title="Select course image"
      />

      <MediaPickerModal
        isOpen={moduleMediaPickerId !== null}
        onClose={() => setModuleMediaPickerId(null)}
        onSelect={(item: MediaItem) => {
          if (!moduleMediaPickerId) return;
          updateModuleMeta(moduleMediaPickerId, { thumbnailUrl: item.url });
        }}
        filter="image"
        title="Select module image"
      />
    </div>
  );
}
