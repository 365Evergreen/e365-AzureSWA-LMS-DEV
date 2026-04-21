import { useState } from 'react';
import type { BlockType } from '@lms/block-registry';
import BlockPalette from '../BlockPalette';
import BlockCanvas from '../BlockCanvas';
import BlockPropertyEditor from '../BlockPropertyEditor';
import styles from './AccordionPanelEditorModal.module.css';

interface PanelBlock {
  id: string;
  type: BlockType;
  payload: unknown;
  background?: string;
}

interface AccordionPanelEditorModalProps {
  isOpen: boolean;
  panelTitle: string;
  initialBlocks: PanelBlock[];
  onSave: (blocks: PanelBlock[]) => void;
  onClose: () => void;
}

export default function AccordionPanelEditorModal({
  isOpen,
  panelTitle,
  initialBlocks,
  onSave,
  onClose,
}: AccordionPanelEditorModalProps) {
  const [panelBlocks, setPanelBlocks] = useState<PanelBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedBlock = panelBlocks.find((block) => block.id === selectedId) ?? null;

  function addBlock(type: BlockType, payload: unknown) {
    const id = crypto.randomUUID();
    setPanelBlocks((previous) => [...previous, { id, type, payload }]);
    setSelectedId(id);
  }

  function updatePayload(id: string, payload: unknown) {
    setPanelBlocks((previous) => previous.map((block) => (block.id === id ? { ...block, payload } : block)));
  }

  function updateBackground(id: string, background: string | undefined) {
    setPanelBlocks((previous) => previous.map((block) => (block.id === id ? { ...block, background } : block)));
  }

  function deleteBlock(id: string) {
    setPanelBlocks((previous) => previous.filter((block) => block.id !== id));
    setSelectedId((previous) => (previous === id ? null : previous));
  }

  function reorderBlocks(reordered: PanelBlock[]) {
    setPanelBlocks(reordered);
  }

  function insertBlocksAfter(afterId: string, newBlocks: Array<{ type: BlockType; payload: unknown }>) {
    setPanelBlocks((previous) => {
      const index = previous.findIndex((block) => block.id === afterId);
      const created = newBlocks.map((block) => ({ id: crypto.randomUUID(), ...block }));
      if (index < 0) return [...previous, ...created];
      return [...previous.slice(0, index + 1), ...created, ...previous.slice(index + 1)];
    });
  }

  function handleSave() {
    onSave(panelBlocks);
    onClose();
  }

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Edit ${panelTitle}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit panel: {panelTitle}</h2>
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
            {panelBlocks.length === 0 ? (
              <div className={styles.emptyCanvas}>
                <p>Select a block from the palette to add it to this panel</p>
              </div>
            ) : (
              <BlockCanvas
                blocks={panelBlocks}
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
