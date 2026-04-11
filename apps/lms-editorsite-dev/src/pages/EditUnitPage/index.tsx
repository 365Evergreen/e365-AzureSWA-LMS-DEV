import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { BlockType } from '@lms/block-registry';
import AppNav from '../../components/AppNav';
import BlockPalette from '../../components/BlockPalette';
import BlockCanvas from '../../components/BlockCanvas';
import BlockPropertyEditor from '../../components/BlockPropertyEditor';
import { loadEditorCatalogueItem, saveUnitContent, publishCatalogueItem } from '../../api/catalogue';
import type { CatalogueItem, UnitDetail } from '../../api/catalogue';
import styles from './EditUnitPage.module.css';

interface EditorBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

export default function EditUnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const pathId = searchParams.get('pathId') ?? undefined;

  const [unit, setUnit] = useState<CatalogueItem | null>(null);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [publishing, setPublishing] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await loadEditorCatalogueItem('UNIT', unitId) as UnitDetail;
      setUnit(detail);
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
    if (!unitId || blocks.length === 0) return;
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
    if (!unitId) return;
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
    if (!unitId || !confirm('Publish this unit?')) return;
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

  if (loading) {
    return <div className={styles.page}><AppNav /><div className={styles.loading}>Loading unit…</div></div>;
  }

  if (error && !unit) {
    return <div className={styles.page}><AppNav /><div className={styles.error}>{error}</div></div>;
  }

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(backTarget)}>← Back to course</button>
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
        </aside>
      </div>
    </div>
  );
}
