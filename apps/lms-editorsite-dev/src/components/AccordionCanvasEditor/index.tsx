import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getBlock, normalizeAccordionPayload, BlockType } from '@lms/block-registry';
import type { AccordionPanel, AccordionPayload } from '@lms/block-registry';
import AccordionPanelEditorModal from '../AccordionPanelEditorModal';
import styles from './AccordionCanvasEditor.module.css';

interface AccordionCanvasEditorProps {
  payload: AccordionPayload;
  onChange: (payload: AccordionPayload) => void;
}

interface PanelCardProps {
  panel: AccordionPanel;
  onUpdate: (panel: AccordionPanel) => void;
  onDelete: () => void;
  onEditContent: () => void;
}

function PanelCard({ panel, onUpdate, onDelete, onEditContent }: PanelCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panel.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.panelCard} ${isDragging ? styles.panelDragging : ''}`}
    >
      <div className={styles.panelHeader}>
        <span className={styles.dragHandle} {...attributes} {...listeners} title="Drag to reorder panels">
          ⠿
        </span>
        <input
          className={styles.panelTitleInput}
          type="text"
          value={panel.title}
          placeholder="Panel title"
          onChange={(event) => onUpdate({ ...panel, title: event.target.value })}
        />
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={panel.defaultOpen ?? false}
            onChange={(event) => onUpdate({ ...panel, defaultOpen: event.target.checked })}
          />
          <span>Open by default</span>
        </label>
        <button type="button" className={styles.deleteBtn} onClick={onDelete} title="Delete panel">
          ✕
        </button>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.panelSummary}>
          {panel.blocks.length === 0 ? (
            <p className={styles.emptyText}>No blocks yet</p>
          ) : (
            <div className={styles.blockPreviewList}>
              {panel.blocks.map((block) => {
                const definition = getBlock(block.type);
                return (
                  <div key={block.id} className={styles.blockChip}>
                    <span className={styles.blockChipIcon}>{definition?.icon ?? '?'}</span>
                    <span className={styles.blockChipLabel}>{definition?.label ?? block.type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button type="button" className={styles.editContentBtn} onClick={onEditContent}>
          {panel.blocks.length > 0 ? 'Edit panel canvas' : '+ Add blocks'}
        </button>
      </div>
    </div>
  );
}

export default function AccordionCanvasEditor({ payload, onChange }: AccordionCanvasEditorProps) {
  const normalized = normalizeAccordionPayload(payload);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);

  function updatePanels(panels: AccordionPanel[]) {
    onChange({ ...normalized, panels });
  }

  function updatePanel(panelId: string, nextPanel: AccordionPanel) {
    updatePanels(normalized.panels.map((panel) => (panel.id === panelId ? nextPanel : panel)));
  }

  function deletePanel(panelId: string) {
    const remaining = normalized.panels.filter((panel) => panel.id !== panelId);
    if (remaining.length === 0) {
      updatePanels([
        {
          id: crypto.randomUUID(),
          title: 'Panel 1',
          defaultOpen: true,
          blocks: [],
        },
      ]);
      return;
    }
    updatePanels(remaining);
  }

  function addPanel() {
    updatePanels([
      ...normalized.panels,
      {
        id: crypto.randomUUID(),
        title: `Panel ${normalized.panels.length + 1}`,
        defaultOpen: false,
        blocks: [],
      },
    ]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = normalized.panels.findIndex((panel) => panel.id === active.id);
    const newIndex = normalized.panels.findIndex((panel) => panel.id === over.id);
    updatePanels(arrayMove(normalized.panels, oldIndex, newIndex));
  }

  const editingPanel = normalized.panels.find((panel) => panel.id === editingPanelId) ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.blockMeta}>
        <div>
          {normalized.title ? <h3 className={styles.blockTitle}>{normalized.title}</h3> : null}
          <p className={styles.blockHelp}>
            Edit panel names inline, drag to reorder, and open a nested canvas for each panel&apos;s content.
          </p>
        </div>
        <span className={`${styles.visibilityBadge} ${normalized.visible === false ? styles.visibilityHidden : ''}`}>
          {normalized.visible === false ? 'Hidden' : 'Visible'}
        </span>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={normalized.panels.map((panel) => panel.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.panelList}>
            {normalized.panels.map((panel) => (
              <PanelCard
                key={panel.id}
                panel={panel}
                onUpdate={(nextPanel) => updatePanel(panel.id, nextPanel)}
                onDelete={() => deletePanel(panel.id)}
                onEditContent={() => setEditingPanelId(panel.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button type="button" className={styles.addPanelBtn} onClick={addPanel}>
        + Add panel
      </button>

      {editingPanel && (
        <AccordionPanelEditorModal
          isOpen
          panelTitle={editingPanel.title || 'Untitled panel'}
          initialBlocks={editingPanel.blocks.map((block) => ({ ...block, type: block.type as BlockType }))}
          onSave={(blocks) => {
            updatePanel(editingPanel.id, { ...editingPanel, blocks });
          }}
          onClose={() => setEditingPanelId(null)}
        />
      )}
    </div>
  );
}
