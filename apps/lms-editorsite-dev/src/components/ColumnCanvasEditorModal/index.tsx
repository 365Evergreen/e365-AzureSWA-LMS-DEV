import { useState } from 'react';
import type { BlockType } from '@lms/block-registry';
import BlockPalette from '../BlockPalette';
import BlockCanvas from '../BlockCanvas';
import BlockPropertyEditor from '../BlockPropertyEditor';
import styles from './ColumnCanvasEditorModal.module.css';

interface ColumnBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

interface ColumnCanvasEditorModalProps {
  isOpen: boolean;
  columnIndex: number;
  initialBlocks: ColumnBlock[];
  onSave: (blocks: ColumnBlock[]) => void;
  onClose: () => void;
}

export default function ColumnCanvasEditorModal({
  isOpen,
  columnIndex,
  initialBlocks,
  onSave,
  onClose,
}: ColumnCanvasEditorModalProps) {
  const [columnBlocks, setColumnBlocks] = useState<ColumnBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedBlock = columnBlocks.find((block) => block.id === selectedId) ?? null;

  function addBlock(type: BlockType, payload: unknown) {
    const id = crypto.randomUUID();
    setColumnBlocks((prev) => [...prev, { id, type, payload }]);
    setSelectedId(id);
  }

  function updatePayload(id: string, payload: unknown) {
    setColumnBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, payload } : block)));
  }

  function deleteBlock(id: string) {
    setColumnBlocks((prev) => prev.filter((block) => block.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  function reorderBlocks(reordered: ColumnBlock[]) {
    setColumnBlocks(reordered);
  }

  function insertBlocksAfter(afterId: string, newBlocks: Array<{ type: BlockType; payload: unknown }>) {
    setColumnBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === afterId);
      const created = newBlocks.map((block) => ({ id: crypto.randomUUID(), ...block }));
      if (index < 0) return [...prev, ...created];
      return [...prev.slice(0, index + 1), ...created, ...prev.slice(index + 1)];
    });
  }

  function handleSave() {
    onSave(columnBlocks);
    onClose();
  }

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Edit column ${columnIndex + 1}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit column {columnIndex + 1}</h2>
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
          <aside className={styles.palette}>
            <BlockPalette onAddBlock={addBlock} />
          </aside>

          <main className={styles.canvas}>
            {columnBlocks.length === 0 ? (
              <div className={styles.emptyCanvas}>
                <p>Select a block from the palette to add it to this column</p>
              </div>
            ) : (
              <BlockCanvas
                blocks={columnBlocks}
                selectedBlockId={selectedId}
                onSelectBlock={setSelectedId}
                onRemoveBlock={deleteBlock}
                onReorderBlocks={reorderBlocks}
                onUpdatePayload={updatePayload}
                onInsertBlocksAfter={insertBlocksAfter}
              />
            )}
          </main>

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
