import { useState } from 'react';
import { getBlock } from '@lms/block-registry';
import type { GridPayload, GridCell, GridCellBlock } from '@lms/block-registry';
import GridCellEditorModal from '../GridCellEditorModal';
import styles from './GridBlockEditor.module.css';

interface GridBlockEditorProps {
  payload: GridPayload;
  onChange: (payload: GridPayload) => void;
}

const COLUMN_OPTIONS = [2, 3, 4] as const;
const ROW_OPTIONS = [1, 2, 3] as const;

function makeCells(count: number, existing: GridCell[]): GridCell[] {
  const result: GridCell[] = [];
  for (let i = 0; i < count; i++) {
    result.push(existing[i] ?? { id: crypto.randomUUID(), blocks: [] });
  }
  return result;
}

export default function GridBlockEditor({ payload, onChange }: GridBlockEditorProps) {
  const [editingCellIndex, setEditingCellIndex] = useState<number | null>(null);

  const totalCells = payload.columns * payload.rows;

  function setColumns(cols: 2 | 3 | 4) {
    const newTotal = cols * payload.rows;
    const losing = payload.cells.slice(newTotal).filter((c) => c.blocks.length > 0).length;
    if (losing > 0 && !confirm(`Reducing columns will remove ${losing} cell(s) with content. Continue?`)) return;
    onChange({ ...payload, columns: cols, cells: makeCells(newTotal, payload.cells) });
  }

  function setRows(rows: 1 | 2 | 3) {
    const newTotal = payload.columns * rows;
    const losing = payload.cells.slice(newTotal).filter((c) => c.blocks.length > 0).length;
    if (losing > 0 && !confirm(`Reducing rows will remove ${losing} cell(s) with content. Continue?`)) return;
    onChange({ ...payload, rows, cells: makeCells(newTotal, payload.cells) });
  }

  function handleCellSave(index: number, blocks: GridCellBlock[]) {
    const updated = payload.cells.map((cell, i) => (i === index ? { ...cell, blocks } : cell));
    onChange({ ...payload, cells: updated });
  }

  function clearCell(index: number) {
    if (!confirm('Clear all blocks from this cell?')) return;
    const updated = payload.cells.map((cell, i) => (i === index ? { ...cell, blocks: [] } : cell));
    onChange({ ...payload, cells: updated });
  }

  const editingCell = editingCellIndex !== null ? payload.cells[editingCellIndex] : null;

  return (
    <div className={styles.editor}>
      {/* Column picker */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Columns</p>
        <div className={styles.pillRow}>
          {COLUMN_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.pill} ${payload.columns === n ? styles.pillActive : ''}`}
              onClick={() => setColumns(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Row picker */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Rows</p>
        <div className={styles.pillRow}>
          {ROW_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.pill} ${payload.rows === n ? styles.pillActive : ''}`}
              onClick={() => setRows(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Grid preview / cell list */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Cells ({totalCells})</p>
        <div
          className={styles.gridPreview}
          style={{ gridTemplateColumns: `repeat(${payload.columns}, 1fr)` }}
        >
          {payload.cells.slice(0, totalCells).map((cell, i) => {
            const hasContent = cell.blocks.length > 0;
            return (
              <div
                key={cell.id}
                className={`${styles.cellCard} ${hasContent ? styles.cellCardFilled : ''}`}
              >
                <div className={styles.cellHeader}>
                  <span className={styles.cellIndex}>{i + 1}</span>
                  {hasContent && (
                    <span className={styles.cellBlockCount}>{cell.blocks.length} block{cell.blocks.length !== 1 ? 's' : ''}</span>
                  )}
                </div>

                {hasContent && (
                  <div className={styles.cellPreview}>
                    {cell.blocks.slice(0, 3).map((block) => {
                      const def = getBlock(block.type as Parameters<typeof getBlock>[0]);
                      return (
                        <div key={block.id} className={styles.cellBlockChip}>
                          <span className={styles.chipIcon}>{def?.icon ?? '?'}</span>
                          <span className={styles.chipLabel}>{def?.label ?? block.type}</span>
                        </div>
                      );
                    })}
                    {cell.blocks.length > 3 && (
                      <div className={styles.cellBlockChip}>
                        <span className={styles.chipLabel}>+{cell.blocks.length - 3} more</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.cellActions}>
                  <button
                    type="button"
                    className={styles.editCellBtn}
                    onClick={() => setEditingCellIndex(i)}
                  >
                    {hasContent ? 'Edit' : '+ Add blocks'}
                  </button>
                  {hasContent && (
                    <button
                      type="button"
                      className={styles.clearCellBtn}
                      onClick={() => clearCell(i)}
                      title="Clear cell"
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

      {/* Cell editor modal */}
      {editingCellIndex !== null && editingCell && (
        <GridCellEditorModal
          isOpen
          cellIndex={editingCellIndex}
          initialBlocks={editingCell.blocks as GridCellBlock[]}
          onSave={(blocks) => handleCellSave(editingCellIndex, blocks)}
          onClose={() => setEditingCellIndex(null)}
        />
      )}
    </div>
  );
}
