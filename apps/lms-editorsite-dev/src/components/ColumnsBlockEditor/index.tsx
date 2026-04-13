import { useState } from 'react';
import { getBlock, normalizeColumnsPayload } from '@lms/block-registry';
import type { ColumnsItem, ColumnsItemBlock, ColumnsPayload } from '@lms/block-registry';
import ColumnCanvasEditorModal from '../ColumnCanvasEditorModal';
import styles from './ColumnsBlockEditor.module.css';

interface ColumnsBlockEditorProps {
  payload: ColumnsPayload;
  onChange: (payload: ColumnsPayload) => void;
}

const COLUMN_OPTIONS = [2, 3, 4] as const;
const GAP_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
] as const;

function ensureItems(count: 2 | 3 | 4, existing: ColumnsItem[]): ColumnsItem[] {
  const items: ColumnsItem[] = [];
  for (let index = 0; index < count; index += 1) {
    items.push(existing[index] ?? { id: crypto.randomUUID(), blocks: [], showOnMobile: true });
  }
  return items;
}

export default function ColumnsBlockEditor({ payload, onChange }: ColumnsBlockEditorProps) {
  const normalized = normalizeColumnsPayload(payload);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);

  function updatePayload(next: Partial<ColumnsPayload>) {
    const columns = next.columns ?? normalized.columns;
    const items = ensureItems(columns, next.items ?? normalized.items);
    onChange({
      ...normalized,
      ...next,
      columns,
      items,
    });
  }

  function setColumns(columns: 2 | 3 | 4) {
    const trimmed = normalized.items.slice(0, columns);
    const losingContent = normalized.items.slice(columns).filter((item) => item.blocks.length > 0).length;
    if (losingContent > 0 && !confirm(`Reducing columns will remove ${losingContent} column${losingContent === 1 ? '' : 's'} with content. Continue?`)) {
      return;
    }
    updatePayload({ columns, items: ensureItems(columns, trimmed) });
  }

  function updateColumn(index: number, nextColumn: ColumnsItem) {
    updatePayload({
      items: normalized.items.map((column, currentIndex) => (currentIndex === index ? nextColumn : column)),
    });
  }

  function clearColumn(index: number) {
    if (!confirm('Clear all blocks from this column?')) return;
    updateColumn(index, { ...normalized.items[index], blocks: [] });
  }

  const editingColumn = editingColumnIndex !== null ? normalized.items[editingColumnIndex] : null;

  return (
    <div className={styles.editor}>
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Columns</p>
        <div className={styles.pillRow}>
          {COLUMN_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              className={`${styles.pill} ${normalized.columns === count ? styles.pillActive : ''}`}
              onClick={() => setColumns(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.field}>
          <span className={styles.sectionLabel}>Gap</span>
          <select
            className={styles.select}
            value={normalized.gap ?? 'md'}
            onChange={(event) => updatePayload({ gap: event.target.value as ColumnsPayload['gap'] })}
          >
            {GAP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Columns canvas</p>
        <div className={styles.columnsPreview} style={{ gridTemplateColumns: `repeat(${normalized.columns}, 1fr)` }}>
          {normalized.items.map((column, index) => {
            const hasContent = column.blocks.length > 0;
            return (
              <div
                key={column.id}
                className={`${styles.columnCard} ${hasContent ? styles.columnCardFilled : ''}`}
              >
                <div className={styles.columnHeader}>
                  <span className={styles.columnIndex}>Column {index + 1}</span>
                  <label className={styles.mobileToggle}>
                    <input
                      type="checkbox"
                      checked={column.showOnMobile !== false}
                      onChange={(event) => updateColumn(index, { ...column, showOnMobile: event.target.checked })}
                    />
                    <span>Show on mobile</span>
                  </label>
                </div>

                {hasContent ? (
                  <div className={styles.columnPreview}>
                    {column.blocks.slice(0, 4).map((block) => {
                      const definition = getBlock(block.type);
                      return (
                        <div key={block.id} className={styles.blockChip}>
                          <span className={styles.blockChipIcon}>{definition?.icon ?? '?'}</span>
                          <span className={styles.blockChipLabel}>{definition?.label ?? block.type}</span>
                        </div>
                      );
                    })}
                    {column.blocks.length > 4 && (
                      <div className={styles.blockChip}>
                        <span className={styles.blockChipLabel}>+{column.blocks.length - 4} more</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyColumn}>
                    <p>No blocks yet</p>
                  </div>
                )}

                <div className={styles.columnActions}>
                  <button
                    type="button"
                    className={styles.editColumnBtn}
                    onClick={() => setEditingColumnIndex(index)}
                  >
                    {hasContent ? 'Edit canvas' : '+ Add blocks'}
                  </button>
                  {hasContent && (
                    <button
                      type="button"
                      className={styles.clearColumnBtn}
                      onClick={() => clearColumn(index)}
                      title="Clear column"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingColumnIndex !== null && editingColumn && (
        <ColumnCanvasEditorModal
          isOpen
          columnIndex={editingColumnIndex}
          initialBlocks={editingColumn.blocks as ColumnsItemBlock[]}
          onSave={(blocks) => updateColumn(editingColumnIndex, { ...editingColumn, blocks })}
          onClose={() => setEditingColumnIndex(null)}
        />
      )}
    </div>
  );
}
