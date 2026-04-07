import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import { createPath, addModule, addUnit } from '../../api/catalogue';
import type { CatalogueItem } from '../../api/catalogue';
import styles from './AddNewCoursePage.module.css';

interface UnitStub { id: string; title: string; unitType: CatalogueItem['unitType']; }
interface ModuleStub { id: string; title: string; units: UnitStub[]; }

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
  const [difficulty, setDifficulty] = useState<CatalogueItem['difficulty']>('Beginner');
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('en');
  const [visibility, setVisibility] = useState<CatalogueItem['visibility']>('Public');

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
    setModules(prev => [...prev, { id, title: 'New Module', units: [] }]);
    setExpandedModules(prev => new Set([...prev, id]));
  };

  const updateModuleTitle = (id: string, val: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, title: val } : m));
  };

  const removeLocalModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const addLocalUnit = (moduleId: string) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, units: [...m.units, { id: `local-unit-${Date.now()}`, title: 'New Unit', unitType: 'Lesson' }] }
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
        estimatedMinutes,
        visibility,
        language,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      // 2. Create modules and units sequentially to preserve order
      for (const mod of modules) {
        const { module } = await addModule(path.itemId, mod.title);
        for (const unit of mod.units) {
          await addUnit(module.itemId, unit.title, unit.unitType ?? 'Lesson');
        }
      }

      navigate(`/courses/edit/${path.itemId}`);
    } catch (err) {
      setSaveError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <AppNav />
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
                placeholder="A brief description shown in the course catalogue…"
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Properties</h2>

            <div className={styles.field}>
              <label className={styles.label}>Difficulty</label>
              <select className={styles.select} value={difficulty} onChange={e => setDifficulty(e.target.value as CatalogueItem['difficulty'])}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Estimated duration (minutes)</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(parseInt(e.target.value) || 0)}
              />
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
    </div>
  );
}
