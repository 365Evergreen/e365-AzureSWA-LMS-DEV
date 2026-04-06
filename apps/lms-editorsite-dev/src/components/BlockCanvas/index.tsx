import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getBlock } from '@lms/block-registry';
import type { BlockType } from '@lms/block-registry';
import styles from './BlockCanvas.module.css';

interface CanvasBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

interface BlockCanvasProps {
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onRemoveBlock: (id: string) => void;
  onReorderBlocks: (blocks: CanvasBlock[]) => void;
}

interface BlockCanvasItemProps {
  block: CanvasBlock;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function BlockCanvasItem({ block, isSelected, onSelect, onRemove }: BlockCanvasItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const def = getBlock(block.type);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
      onClick={onSelect}
    >
      <div className={styles.toolbar}>
        <span className={styles.dragHandle} {...attributes} {...listeners} title="Drag to reorder">
          ⠿
        </span>
        <span className={styles.blockLabel}>{def?.label ?? block.type}</span>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Delete block"
        >
          ✕
        </button>
      </div>
      <div className={styles.renderer}>
        {def ? <def.Renderer payload={block.payload} blockId={block.id} /> : <p>Unknown block type</p>}
      </div>
    </div>
  );
}

export default function BlockCanvas({ blocks, selectedBlockId, onSelectBlock, onRemoveBlock, onReorderBlocks }: BlockCanvasProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onReorderBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  }

  if (blocks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Drag a block from the palette or click to add</p>
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className={styles.canvas}>
          {blocks.map((block) => (
            <BlockCanvasItem
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={() => onSelectBlock(block.id)}
              onRemove={() => onRemoveBlock(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
