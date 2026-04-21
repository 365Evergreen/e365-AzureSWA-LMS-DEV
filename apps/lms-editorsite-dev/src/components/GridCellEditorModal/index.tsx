import { useState } from 'react';
import type { BlockType } from '@lms/block-registry';
import BlockPalette from '../BlockPalette';
import BlockCanvas from '../BlockCanvas';
import BlockPropertyEditor from '../BlockPropertyEditor';
import styles from './GridCellEditorModal.module.css';

interface CellBlock {
  id: string;
  type: BlockType;
  payload: unknown;
  background?: string;
}

interface GridCellEditorModalProps {
  isOpen: boolean;
  cellIndex: number;
  initialBlocks: CellBlock[];
  onSave: (blocks: CellBlock[]) => void;
  onClose: () => void;
}

export default function GridCellEditorModal({
  isOpen,
  cellIndex,
  initialBlocks,
  onSave,
  onClose,
}: GridCellEditorModalProps) {
  const [cellBlocks, setCellBlocks] = useState<CellBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedBlock = cellBlocks.find((b) => b.id === selectedId) ?? null;

  function addBlock(type: BlockType, payload: unknown) {
    const id = crypto.randomUUID();
    setCellBlocks((prev) => [...prev, { id, type, payload }]);
    setSelectedId(id);
  }

  function updatePayload(id: string, payload: unknown) {
    setCellBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, payload } : b)));
  }

  function updateBackground(id: string, background: string | undefined) {
    setCellBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, background } : b)));
  }

  function deleteBlock(id: string) {
    setCellBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  function reorderBlocks(reordered: CellBlock[]) {
    setCellBlocks(reordered);
  }

  function insertBlocksAfter(afterId: string, newBlocks: Array<{ type: BlockType; payload: unknown }>) {
    setCellBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === afterId);
      const created = newBlocks.map((nb) => ({ id: crypto.randomUUID(), ...nb }));
      if (idx < 0) return [...prev, ...created];
      return [...prev.slice(0, idx + 1), ...created, ...prev.slice(idx + 1)];
    });
  }

  function handleSave() {
    onSave(cellBlocks);
    onClose();
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Edit cell ${cellIndex + 1}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit cell {cellIndex + 1}</h2>
          <div className={styles.headerActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={styles.saveBtn} onClick={handleSave}>
              Done
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {/* Block palette */}
          <aside className={styles.palette}>
            <BlockPalette onAddBlock={addBlock} />
          </aside>

          {/* Canvas */}
          <main className={styles.canvas}>
            {cellBlocks.length === 0 ? (
              <div className={styles.emptyCanvas}>
                <p>Select a block from the palette to add it to this cell</p>
              </div>
            ) : (
              <BlockCanvas
                blocks={cellBlocks}
                selectedBlockId={selectedId}
                onSelectBlock={setSelectedId}
                onRemoveBlock={deleteBlock}
                onReorderBlocks={reorderBlocks}
                onUpdatePayload={updatePayload}
                onUpdateBackground={updateBackground}
                onInsertBlocksAfter={insertBlocksAfter}
              />
            )}
          </main>

          {/* Properties pane */}
          <aside className={styles.properties}>
            <BlockPropertyEditor
              block={selectedBlock}
              onUpdatePayload={(payload) => {
                if (selectedBlock) updatePayload(selectedBlock.id, payload);
              }}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

// Re-export the CellBlock type for use in GridBlockEditor
export type { CellBlock };
