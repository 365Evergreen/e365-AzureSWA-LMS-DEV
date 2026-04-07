import styles from './TextBlockPropertyEditor.module.css';
import type { BlockType, TextSize } from '@lms/block-registry';
import { TEXT_SIZES, TEXT_SIZE_CSS } from '@lms/block-registry';

// ─── Alignment icons (SVG, consistent with canvas toolbar) ───────────────────

function AlignLeftIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 15 13" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="15" height="2.5" rx="1.25" />
      <rect x="0" y="5.25" width="9" height="2.5" rx="1.25" />
      <rect x="0" y="10.5" width="15" height="2.5" rx="1.25" />
    </svg>
  );
}
function AlignCenterIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 15 13" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="15" height="2.5" rx="1.25" />
      <rect x="3" y="5.25" width="9" height="2.5" rx="1.25" />
      <rect x="0" y="10.5" width="15" height="2.5" rx="1.25" />
    </svg>
  );
}
function AlignRightIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 15 13" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="15" height="2.5" rx="1.25" />
      <rect x="6" y="5.25" width="9" height="2.5" rx="1.25" />
      <rect x="0" y="10.5" width="15" height="2.5" rx="1.25" />
    </svg>
  );
}

// ─── Shared sub-editors ───────────────────────────────────────────────────────

interface AlignmentProps {
  value: string;
  onChange: (v: 'left' | 'center' | 'right') => void;
}
function AlignmentControl({ value, onChange }: AlignmentProps) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>Alignment</label>
      <div className={styles.segmented}>
        <button type="button" title="Left" className={`${styles.seg} ${value === 'left' ? styles.segActive : ''}`} onClick={() => onChange('left')}><AlignLeftIcon /></button>
        <button type="button" title="Centre" className={`${styles.seg} ${value === 'center' ? styles.segActive : ''}`} onClick={() => onChange('center')}><AlignCenterIcon /></button>
        <button type="button" title="Right" className={`${styles.seg} ${value === 'right' ? styles.segActive : ''}`} onClick={() => onChange('right')}><AlignRightIcon /></button>
      </div>
    </div>
  );
}

interface WeightProps {
  value: string;
  onChange: (v: 'normal' | 'bold' | 'light') => void;
}
function WeightControl({ value, onChange }: WeightProps) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>Weight</label>
      <div className={styles.segmented}>
        {(['light', 'normal', 'bold'] as const).map((w) => (
          <button
            key={w}
            type="button"
            className={`${styles.seg} ${value === w ? styles.segActive : ''}`}
            onClick={() => onChange(w)}
          >
            {w.charAt(0).toUpperCase() + w.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ItalicProps {
  value: boolean;
  onChange: (v: boolean) => void;
}
function ItalicControl({ value, onChange }: ItalicProps) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>Italic</label>
      <label className={styles.toggle}>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span>On</span>
      </label>
    </div>
  );
}

interface UnderlineProps { value: boolean; onChange: (v: boolean) => void; }
function UnderlineControl({ value, onChange }: UnderlineProps) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>Underline</label>
      <label className={styles.toggle}>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span>On</span>
      </label>
    </div>
  );
}

interface SizeProps { value: TextSize; onChange: (v: TextSize) => void; }
function SizeControl({ value, onChange }: SizeProps) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>Size</label>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value as TextSize)}>
        {TEXT_SIZES.map((s) => (
          <option key={s} value={s} style={{ fontSize: TEXT_SIZE_CSS[s] }}>{s}</option>
        ))}
      </select>
    </div>
  );
}

interface LinkPayload { url: string; newTab: boolean }
interface LinkProps {
  value?: LinkPayload;
  onChange: (v: LinkPayload | undefined) => void;
}
function LinkControl({ value, onChange }: LinkProps) {
  const enabled = !!value;
  return (
    <div className={styles.linkGroup}>
      <div className={styles.row}>
        <label className={styles.label}>Add link</label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked ? { url: '', newTab: false } : undefined)}
          />
          <span>On</span>
        </label>
      </div>
      {enabled && (
        <>
          <div className={styles.row}>
            <label className={styles.label}>URL</label>
            <input
              className={styles.input}
              type="url"
              value={value?.url ?? ''}
              placeholder="https://..."
              onChange={(e) => onChange({ url: e.target.value, newTab: value?.newTab ?? false })}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Open in new tab</label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={value?.newTab ?? false}
                onChange={(e) => onChange({ url: value?.url ?? '', newTab: e.target.checked })}
              />
              <span>On</span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Per-type editors ─────────────────────────────────────────────────────────

interface TextEditorProps {
  payload: Record<string, unknown>;
  onChange: (payload: unknown) => void;
}

function HeadingEditor({ payload, onChange }: TextEditorProps) {
  const p = payload as { text: string; level: number; alignment: string; weight: string; italic: boolean; underline: boolean; size: TextSize; link?: { url: string; newTab: boolean } };
  const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch });
  return (
    <>
      <div className={styles.row}>
        <label className={styles.label}>Text</label>
        <input className={styles.input} value={p.text} onChange={(e) => set({ text: e.target.value })} />
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Level</label>
        <div className={styles.segmented}>
          {([1, 2, 3, 4, 5, 6] as const).map((l) => (
            <button key={l} type="button" className={`${styles.seg} ${p.level === l ? styles.segActive : ''}`} onClick={() => set({ level: l })}>
              H{l}
            </button>
          ))}
        </div>
      </div>
      <AlignmentControl value={p.alignment} onChange={(v) => set({ alignment: v })} />
      <WeightControl value={p.weight} onChange={(v) => set({ weight: v })} />
      <ItalicControl value={p.italic} onChange={(v) => set({ italic: v })} />
      <UnderlineControl value={p.underline ?? false} onChange={(v) => set({ underline: v })} />
      <SizeControl value={p.size ?? 'base'} onChange={(v) => set({ size: v })} />
      <LinkControl value={p.link} onChange={(v) => set({ link: v })} />
    </>
  );
}

function ParagraphEditor({ payload, onChange }: TextEditorProps) {
  const p = payload as { html: string; alignment: string; weight: string; italic: boolean; underline: boolean; size: TextSize; link?: { url: string; newTab: boolean } };
  const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch });
  return (
    <>
      <div className={styles.row}>
        <label className={styles.label}>Text</label>
        <textarea className={styles.textarea} rows={4} value={p.html} onChange={(e) => set({ html: e.target.value })} />
      </div>
      <AlignmentControl value={p.alignment} onChange={(v) => set({ alignment: v })} />
      <WeightControl value={p.weight} onChange={(v) => set({ weight: v })} />
      <ItalicControl value={p.italic} onChange={(v) => set({ italic: v })} />
      <UnderlineControl value={p.underline ?? false} onChange={(v) => set({ underline: v })} />
      <SizeControl value={p.size ?? 'base'} onChange={(v) => set({ size: v })} />
      <LinkControl value={p.link} onChange={(v) => set({ link: v })} />
    </>
  );
}

function ListEditor({ payload, onChange, ordered }: TextEditorProps & { ordered: boolean }) {
  const p = payload as { items: string[] };
  const setItems = (items: string[]) => onChange({ ...p, items });
  return (
    <div className={styles.listEditor}>
      {p.items.map((item, i) => (
        <div key={i} className={styles.listItem}>
          <span className={styles.listBullet}>{ordered ? `${i + 1}.` : '•'}</span>
          <input
            className={styles.input}
            value={item}
            onChange={(e) => {
              const updated = [...p.items];
              updated[i] = e.target.value;
              setItems(updated);
            }}
          />
          <button
            type="button"
            className={styles.listRemove}
            onClick={() => setItems(p.items.filter((_, j) => j !== i))}
            title="Remove item"
          >✕</button>
        </div>
      ))}
      <button type="button" className={styles.listAdd} onClick={() => setItems([...p.items, ''])}>
        + Add item
      </button>
    </div>
  );
}

function CodeEditor({ payload, onChange }: TextEditorProps) {
  const p = payload as { code: string; language: string; filename?: string; numberLines: boolean; allowCopy: boolean };
  const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch });
  const languages = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'sql', 'csharp', 'java'];
  return (
    <>
      <div className={styles.row}>
        <label className={styles.label}>Language</label>
        <select className={styles.select} value={p.language} onChange={(e) => set({ language: e.target.value })}>
          {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          {!languages.includes(p.language) && <option value={p.language}>{p.language}</option>}
        </select>
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Filename</label>
        <input className={styles.input} value={p.filename ?? ''} placeholder="optional" onChange={(e) => set({ filename: e.target.value || undefined })} />
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Number lines</label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={p.numberLines} onChange={(e) => set({ numberLines: e.target.checked })} />
          <span>On</span>
        </label>
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Copy button</label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={p.allowCopy} onChange={(e) => set({ allowCopy: e.target.checked })} />
          <span>On</span>
        </label>
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Code</label>
        <textarea className={styles.textarea} rows={10} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={p.code} onChange={(e) => set({ code: e.target.value })} spellCheck={false} />
      </div>
    </>
  );
}

function DetailEditor({ payload, onChange }: TextEditorProps) {
  const p = payload as { summary: string; body: string };
  const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch });
  return (
    <>
      <div className={styles.row}>
        <label className={styles.label}>Summary</label>
        <input className={styles.input} value={p.summary} onChange={(e) => set({ summary: e.target.value })} />
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Body</label>
        <textarea className={styles.textarea} rows={5} value={p.body} onChange={(e) => set({ body: e.target.value })} />
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface TextBlockPropertyEditorProps {
  blockType: BlockType;
  payload: Record<string, unknown>;
  onChange: (payload: unknown) => void;
}

const TEXT_BLOCK_TYPES = new Set(['heading', 'paragraph', 'numbered-list', 'bulleted-list', 'code', 'detail']);

export function isTextBlock(type: BlockType): boolean {
  return TEXT_BLOCK_TYPES.has(type);
}

export default function TextBlockPropertyEditor({ blockType, payload, onChange }: TextBlockPropertyEditorProps) {
  switch (blockType) {
    case 'heading':
      return <HeadingEditor payload={payload} onChange={onChange} />;
    case 'paragraph':
      return <ParagraphEditor payload={payload} onChange={onChange} />;
    case 'numbered-list':
      return <ListEditor payload={payload} onChange={onChange} ordered={true} />;
    case 'bulleted-list':
      return <ListEditor payload={payload} onChange={onChange} ordered={false} />;
    case 'code':
      return <CodeEditor payload={payload} onChange={onChange} />;
    case 'detail':
      return <DetailEditor payload={payload} onChange={onChange} />;
    default:
      return null;
  }
}
