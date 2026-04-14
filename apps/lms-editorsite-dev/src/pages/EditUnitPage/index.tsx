import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { BlockType } from '@lms/block-registry';
import BlockPalette from '../../components/BlockPalette';
import BlockCanvas from '../../components/BlockCanvas';
import BlockPropertyEditor from '../../components/BlockPropertyEditor';
import {
  loadEditorCatalogueItem,
  saveUnitContent,
  publishCatalogueItem,
  patchCatalogueItem,
  archiveCatalogueItem,
} from '../../api/catalogue';
import type { CatalogueItem, UnitDetail } from '../../api/catalogue';
import styles from './EditUnitPage.module.css';

interface EditorBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

interface UnitEditorCanvasProps {
  unitId: string;
  pathId?: string;
  onClose?: () => void;
}

export function UnitEditorCanvas({ unitId, pathId, onClose }: UnitEditorCanvasProps) {
  const navigate = useNavigate();

  const [unit, setUnit] = useState<CatalogueItem | null>(null);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [publishing, setPublishing] = useState(false);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [unitType, setUnitType] = useState<CatalogueItem['unitType']>('Lesson');
  const [isCurrent, setIsCurrent] = useState(true);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await loadEditorCatalogueItem('UNIT', unitId) as UnitDetail;
      setUnit(detail);
      setTitle(detail.title);
      setSlug(detail.slug);
      setSummary(detail.summary ?? '');
      setEstimatedMinutes(detail.estimatedMinutes ?? 0);
      setUnitType(detail.unitType ?? 'Lesson');
      setIsCurrent(detail.status !== 'Archived');
      if (detail.blocks && Array.isArray(detail.blocks)) {
        setBlocks(detail.blocks as EditorBlock[]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => { load(); }, [load]);

  // Auto-save on block change (debounced 3s)
  useEffect(() => {
    if (blocks.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveUnitContent(unitId, blocks as Parameters<typeof saveUnitContent>[1]);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [blocks, unitId]);

  const handleSaveNow = async () => {
    setSaving(true);
    try {
      await saveUnitContent(unitId, blocks as Parameters<typeof saveUnitContent>[1]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setError((err as Error).message);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this unit?')) return;
    setPublishing(true);
    try {
      await handleSaveNow();
      await publishCatalogueItem('UNIT', unitId);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveMetadata = async () => {
    setMetadataSaving(true);
    setError(null);
    try {
      await patchCatalogueItem('UNIT', unitId, {
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        estimatedMinutes,
        unitType,
        status: isCurrent ? (unit?.status === 'Archived' ? 'Draft' : unit?.status) ?? 'Draft' : 'Archived',
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMetadataSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this unit? It will remain visible to editors only.')) return;
    try {
      await archiveCatalogueItem('UNIT', unitId);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  function addBlock(type: BlockType, payload: unknown) {
    const id = crypto.randomUUID();
    setBlocks(prev => [...prev, { id, type, payload }]);
    setSelectedBlockId(id);
  }

  function updatePayload(id: string, payload: unknown) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, payload } : b));
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
    setSelectedBlockId(prev => prev === id ? null : prev);
  }

  function reorderBlocks(reordered: EditorBlock[]) {
    setBlocks(reordered);
  }

  function insertBlocksAfter(afterId: string, newBlocks: Array<{ type: BlockType; payload: unknown }>) {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const created = newBlocks.map(nb => ({ id: crypto.randomUUID(), ...nb }));
      if (idx < 0) return [...prev, ...created];
      return [...prev.slice(0, idx + 1), ...created, ...prev.slice(idx + 1)];
    });
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) ?? null;

  const backTarget = pathId ? `/courses/edit/${pathId}` : '/courses';
  const backLabel = onClose ? '✕ Close unit' : '← Back to course';
  const handleBack = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(backTarget);
  };

  if (loading) {
    return <div className={styles.page}><div className={styles.loading}>Loading unit…</div></div>;
  }

  if (error && !unit) {
    return <div className={styles.page}><div className={styles.error}>{error}</div></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleBack}>{backLabel}</button>
        <div className={styles.unitMeta}>
          <span className={styles.unitLabel}>{unit?.unitType ?? 'Unit'}</span>
          <h1 className={styles.pageTitle}>{unit?.title ?? 'Edit Unit'}</h1>
        </div>
        <div className={styles.topBarActions}>
          {error && <span className={styles.saveError}>{error}</span>}
          {saveStatus === 'saved' && <span className={styles.savedNote}>✓ Saved</span>}
          {saveStatus === 'error' && <span className={styles.saveError}>Save failed</span>}
          <button className={styles.saveBtn} onClick={handleSaveNow} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {unit?.status !== 'Published' && (
            <button className={styles.publishBtn} onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish Unit'}
            </button>
          )}
          {unit?.status === 'Published' && (
            <span className={styles.publishedBadge}>✓ Published</span>
          )}
          {unit?.status !== 'Archived' && (
            <button className={styles.archiveBtn} onClick={handleArchive}>
              Archive
            </button>
          )}
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* ── Block palette sidebar ── */}
        <aside className={styles.palette}>
          <BlockPalette onAddBlock={addBlock} />
        </aside>

        {/* ── Canvas ── */}
        <main className={styles.canvas}>
          <BlockCanvas
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onRemoveBlock={deleteBlock}
            onReorderBlocks={reorderBlocks}
            onUpdatePayload={updatePayload}
            onInsertBlocksAfter={insertBlocksAfter}
          />
        </main>

        {/* ── Properties pane ── */}
        <aside className={styles.properties}>
          <div className={styles.metaSection}>
            <h2 className={styles.sideTitle}>Unit details</h2>

            <label className={styles.fieldLabel}>Title</label>
            <input className={styles.fieldInput} value={title} onChange={(e) => setTitle(e.target.value)} />

            <label className={styles.fieldLabel}>Slug</label>
            <input className={styles.fieldInput} value={slug} onChange={(e) => setSlug(e.target.value)} />

            <label className={styles.fieldLabel}>Summary</label>
            <textarea
              className={styles.fieldTextarea}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              maxLength={1000}
            />

            <label className={styles.fieldLabel}>Duration (minutes)</label>
            <input
              className={styles.fieldInput}
              type="number"
              min={0}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 0)}
            />

            <label className={styles.fieldLabel}>Unit type</label>
            <select className={styles.fieldInput} value={unitType ?? 'Lesson'} onChange={(e) => setUnitType(e.target.value as CatalogueItem['unitType'])}>
              <option value="Lesson">Lesson</option>
              <option value="Video">Video</option>
              <option value="Assessment">Assessment</option>
              <option value="Interactive">Interactive</option>
            </select>

            <label className={styles.currentToggle}>
              <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
              <span>Current</span>
            </label>

            <button className={styles.metaSaveBtn} onClick={handleSaveMetadata} disabled={metadataSaving}>
              {metadataSaving ? 'Saving details…' : 'Save details'}
            </button>
          </div>

          <div className={styles.blockSection}>
            <h2 className={styles.sideTitle}>Block properties</h2>
          {selectedBlock ? (
            <BlockPropertyEditor
              block={selectedBlock}
              onUpdatePayload={(payload) => updatePayload(selectedBlock.id, payload)}
            />
          ) : (
            <div className={styles.noSelection}>
              <p>Select a block to edit its properties.</p>
            </div>
          )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function EditUnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();

  if (!unitId) {
    return <div className={styles.page}><div className={styles.error}>Unit not found.</div></div>;
  }

  return <UnitEditorCanvas unitId={unitId} pathId={searchParams.get('pathId') ?? undefined} />;
}
