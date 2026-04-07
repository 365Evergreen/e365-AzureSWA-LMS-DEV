import { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getBlock, TEXT_SIZE_CSS } from '@lms/block-registry';
import type { BlockType, TextSize } from '@lms/block-registry';
import styles from './BlockCanvas.module.css';

// ─── Block types that support inline editing ──────────────────────────────────

const INLINE_EDITABLE = new Set<BlockType>([
  'heading', 'paragraph', 'numbered-list', 'bulleted-list', 'code', 'detail',
]);

const INLINE_FORMATTED = new Set<BlockType>(['heading', 'paragraph']);

// ─── SVG icons ────────────────────────────────────────────────────────────────

function AlignLeftIcon() {
  return (
    <svg width="15" height="13" viewBox="0 0 15 13" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="15" height="2.5" rx="1.25" />
      <rect x="0" y="5.25" width="9" height="2.5" rx="1.25" />
      <rect x="0" y="10.5" width="15" height="2.5" rx="1.25" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="15" height="13" viewBox="0 0 15 13" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="15" height="2.5" rx="1.25" />
      <rect x="3" y="5.25" width="9" height="2.5" rx="1.25" />
      <rect x="0" y="10.5" width="15" height="2.5" rx="1.25" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="15" height="13" viewBox="0 0 15 13" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="15" height="2.5" rx="1.25" />
      <rect x="6" y="5.25" width="9" height="2.5" rx="1.25" />
      <rect x="0" y="10.5" width="15" height="2.5" rx="1.25" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7 4" />
      <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5L9 12" />
    </svg>
  );
}

// ─── Inline formatting toolbar ────────────────────────────────────────────────

interface InlineToolbarProps {
  payload: Record<string, unknown>;
  blockType: BlockType;
  onChange: (payload: unknown) => void;
  onLinkClick: () => void;
  linkRowOpen: boolean;
}

function InlineToolbar({ payload, onChange, onLinkClick, linkRowOpen }: InlineToolbarProps) {
  const p = payload;
  const alignment = (p.alignment as string) ?? 'left';
  const weight = (p.weight as string) ?? 'normal';
  const italic = !!(p.italic as boolean);
  const underline = !!(p.underline as boolean);
  const size = (p.size as TextSize) ?? 'base';
  const hasLink = !!(p.link as object | undefined);

  function set(patch: Record<string, unknown>) {
    onChange({ ...p, ...patch });
  }

  const sizes: TextSize[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'];

  return (
    <div className={styles.inlineToolbar} onClick={(e) => e.stopPropagation()}>
      {/* Alignment */}
      <div className={styles.toolbarGroup}>
        <button type="button" title="Align left" className={`${styles.toolbarBtn} ${alignment === 'left' ? styles.toolbarBtnActive : ''}`} onMouseDown={(e) => { e.preventDefault(); set({ alignment: 'left' }); }}>
          <AlignLeftIcon />
        </button>
        <button type="button" title="Align centre" className={`${styles.toolbarBtn} ${alignment === 'center' ? styles.toolbarBtnActive : ''}`} onMouseDown={(e) => { e.preventDefault(); set({ alignment: 'center' }); }}>
          <AlignCenterIcon />
        </button>
        <button type="button" title="Align right" className={`${styles.toolbarBtn} ${alignment === 'right' ? styles.toolbarBtnActive : ''}`} onMouseDown={(e) => { e.preventDefault(); set({ alignment: 'right' }); }}>
          <AlignRightIcon />
        </button>
      </div>
      <div className={styles.toolbarDivider} />
      {/* Weight / style */}
      <div className={styles.toolbarGroup}>
        <button type="button" title="Bold" className={`${styles.toolbarBtn} ${styles.toolbarBtnBold} ${weight === 'bold' ? styles.toolbarBtnActive : ''}`} onMouseDown={(e) => { e.preventDefault(); set({ weight: weight === 'bold' ? 'normal' : 'bold' }); }}>B</button>
        <button type="button" title="Italic" className={`${styles.toolbarBtn} ${styles.toolbarBtnItalic} ${italic ? styles.toolbarBtnActive : ''}`} onMouseDown={(e) => { e.preventDefault(); set({ italic: !italic }); }}>I</button>
        <button type="button" title="Underline" className={`${styles.toolbarBtn} ${styles.toolbarBtnUnderline} ${underline ? styles.toolbarBtnActive : ''}`} onMouseDown={(e) => { e.preventDefault(); set({ underline: !underline }); }}>U</button>
      </div>
      <div className={styles.toolbarDivider} />
      {/* Size */}
      <select
        className={styles.sizeSelect}
        value={size}
        title="Font size"
        onChange={(e) => set({ size: e.target.value as TextSize })}
        onClick={(e) => e.stopPropagation()}
      >
        {sizes.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div className={styles.toolbarDivider} />
      {/* Link */}
      <button
        type="button"
        title={hasLink ? 'Edit link' : 'Add link'}
        className={`${styles.toolbarBtn} ${(hasLink || linkRowOpen) ? styles.toolbarBtnActive : ''}`}
        onMouseDown={(e) => { e.preventDefault(); onLinkClick(); }}
      >
        <LinkIcon />
      </button>
    </div>
  );
}

// ─── Link row ─────────────────────────────────────────────────────────────────

interface LinkRowProps {
  payload: Record<string, unknown>;
  onChange: (payload: unknown) => void;
  onClose: () => void;
}

function LinkRow({ payload, onChange, onClose }: LinkRowProps) {
  const existing = payload.link as { url: string; newTab?: boolean } | undefined;
  const [url, setUrl] = useState(existing?.url ?? '');
  const [newTab, setNewTab] = useState(existing?.newTab ?? false);

  function apply() {
    if (url.trim()) {
      onChange({ ...payload, link: { url: url.trim(), newTab } });
    }
    onClose();
  }

  function remove() {
    const { link: _, ...rest } = payload;
    onChange(rest);
    onClose();
  }

  return (
    <div className={styles.linkRow} onClick={(e) => e.stopPropagation()}>
      <LinkIcon />
      <input
        className={styles.linkInput}
        type="url"
        value={url}
        placeholder="https://..."
        autoFocus
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') apply(); if (e.key === 'Escape') onClose(); }}
      />
      <label className={styles.linkNewTab}>
        <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
        New tab
      </label>
      <button type="button" className={styles.linkApply} onMouseDown={(e) => { e.preventDefault(); apply(); }}>Apply</button>
      {existing && (
        <button type="button" className={styles.linkRemove} onMouseDown={(e) => { e.preventDefault(); remove(); }}>Remove</button>
      )}
      <button type="button" className={styles.linkClose} onMouseDown={(e) => { e.preventDefault(); onClose(); }} title="Close">✕</button>
    </div>
  );
}

// ─── Inline content editors ───────────────────────────────────────────────────

interface InlineEditorProps {
  block: CanvasBlock;
  onChange: (payload: unknown) => void;
  onInsertAfter: (blocks: Array<{ type: BlockType; payload: unknown }>) => void;
}

function splitPastedText(text: string): string[] {
  return text
    .split(/(\r?\n){2,}/)
    .map((s) => s.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean);
}

function InlineEditor({ block, onChange, onInsertAfter }: InlineEditorProps) {
  const p = block.payload as Record<string, unknown>;
  const alignment = (p.alignment as string) ?? 'left';
  const weight = (p.weight as string) ?? 'normal';
  const italic = !!(p.italic as boolean);
  const underline = !!(p.underline as boolean);
  const size = (p.size as TextSize) ?? 'base';

  const textStyle: React.CSSProperties = {
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: weight === 'bold' ? 700 : weight === 'light' ? 300 : 400,
    fontStyle: italic ? 'italic' : 'normal',
    textDecoration: underline ? 'underline' : undefined,
    fontSize: TEXT_SIZE_CSS[size],
  };

  switch (block.type) {
    case 'heading': {
      const level = (p.level as number) ?? 2;
      const headingSizes: Record<number, string> = { 1: '2em', 2: '1.5em', 3: '1.25em', 4: '1.1em', 5: '1em', 6: '0.9em' };
      return (
        <input
          className={styles.inlineInput}
          style={{ ...textStyle, fontSize: (p.size ? TEXT_SIZE_CSS[p.size as TextSize] : headingSizes[level]) }}
          defaultValue={p.text as string}
          placeholder="Heading text"
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onChange({ ...p, text: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text/plain');
            const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
            if (lines.length < 2) return;
            e.preventDefault();
            e.currentTarget.value = lines[0];
            onChange({ ...p, text: lines[0] });
            onInsertAfter(lines.slice(1).map((html) => ({ type: 'paragraph' as BlockType, payload: { html } })));
          }}
        />
      );
    }

    case 'paragraph':
      return (
        <textarea
          className={styles.inlineTextarea}
          style={textStyle}
          defaultValue={p.html as string}
          placeholder="Paragraph text"
          rows={3}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onChange({ ...p, html: e.target.value })}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text/plain');
            const paras = splitPastedText(text);
            if (paras.length < 2) return;
            e.preventDefault();
            e.currentTarget.value = paras[0];
            onChange({ ...p, html: paras[0] });
            onInsertAfter(paras.slice(1).map((html) => ({ type: 'paragraph' as BlockType, payload: { ...p, html } })));
          }}
        />
      );

    case 'numbered-list':
    case 'bulleted-list': {
      const items = (p.items as string[]) ?? [];
      const ordered = block.type === 'numbered-list';
      function updateItem(i: number, val: string) {
        const updated = [...items]; updated[i] = val;
        onChange({ ...p, items: updated });
      }
      function addItem() { onChange({ ...p, items: [...items, ''] }); }
      function removeItem(i: number) { onChange({ ...p, items: items.filter((_, j) => j !== i) }); }
      return (
        <div className={styles.inlineList} onClick={(e) => e.stopPropagation()}>
          {items.map((item, i) => (
            <div key={i} className={styles.inlineListItem}>
              <span className={styles.inlineListMarker}>{ordered ? `${i + 1}.` : '•'}</span>
              <input className={styles.inlineListInput} defaultValue={item} placeholder="List item"
                onBlur={(e) => updateItem(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
              />
              <button type="button" className={styles.inlineListRemove} onMouseDown={(e) => { e.preventDefault(); removeItem(i); }} title="Remove">✕</button>
            </div>
          ))}
          <button type="button" className={styles.inlineListAdd} onMouseDown={(e) => { e.preventDefault(); addItem(); }}>+ Add item</button>
        </div>
      );
    }

    case 'code':
      return (
        <textarea className={styles.inlineCode} defaultValue={p.code as string} placeholder="// code here" rows={6} spellCheck={false}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onChange({ ...p, code: e.target.value })}
        />
      );

    case 'detail':
      return (
        <div className={styles.inlineDetail} onClick={(e) => e.stopPropagation()}>
          <input className={styles.inlineInput} defaultValue={p.summary as string} placeholder="Summary (click to expand)" style={{ fontWeight: 600 }}
            onBlur={(e) => onChange({ ...p, summary: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          />
          <textarea className={styles.inlineTextarea} defaultValue={p.body as string} placeholder="Detail body" rows={3}
            onBlur={(e) => onChange({ ...p, body: e.target.value })}
          />
        </div>
      );

    default:
      return null;
  }
}

// ─── Canvas block item ────────────────────────────────────────────────────────

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
  onUpdatePayload: (id: string, payload: unknown) => void;
  onInsertBlocksAfter: (afterId: string, blocks: Array<{ type: BlockType; payload: unknown }>) => void;
}

interface BlockCanvasItemProps {
  block: CanvasBlock;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onUpdatePayload: (payload: unknown) => void;
  onInsertAfter: (blocks: Array<{ type: BlockType; payload: unknown }>) => void;
}

function BlockCanvasItem({ block, isSelected, onSelect, onRemove, onUpdatePayload, onInsertAfter }: BlockCanvasItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [showLinkRow, setShowLinkRow] = useState(false);
  const def = getBlock(block.type);
  const canInline = INLINE_EDITABLE.has(block.type);
  const canFormat = INLINE_FORMATTED.has(block.type);

  useEffect(() => {
    if (!isSelected) setShowLinkRow(false);
  }, [isSelected]);

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
      className={`${styles.item} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
      onClick={onSelect}
    >
      <div className={styles.toolbar}>
        <span className={styles.dragHandle} {...attributes} {...listeners} title="Drag to reorder">⠿</span>
        <span className={styles.blockLabel}>{def?.label ?? block.type}</span>
        {isSelected && canInline && (
          <InlineToolbar
            payload={block.payload as Record<string, unknown>}
            blockType={block.type}
            onChange={onUpdatePayload}
            onLinkClick={() => setShowLinkRow((v) => !v)}
            linkRowOpen={showLinkRow}
          />
        )}
        <button type="button" className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Delete block">✕</button>
      </div>
      {isSelected && showLinkRow && canFormat && (
        <LinkRow payload={block.payload as Record<string, unknown>} onChange={onUpdatePayload} onClose={() => setShowLinkRow(false)} />
      )}
      <div className={styles.renderer}>
        {isSelected && canInline
          ? <InlineEditor block={block} onChange={onUpdatePayload} onInsertAfter={onInsertAfter} />
          : def ? <def.Renderer payload={block.payload} blockId={block.id} /> : <p>Unknown block type</p>
        }
      </div>
    </div>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

export default function BlockCanvas({ blocks, selectedBlockId, onSelectBlock, onRemoveBlock, onReorderBlocks, onUpdatePayload, onInsertBlocksAfter }: BlockCanvasProps) {
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
              onUpdatePayload={(payload) => onUpdatePayload(block.id, payload)}
              onInsertAfter={(newBlocks) => onInsertBlocksAfter(block.id, newBlocks)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
