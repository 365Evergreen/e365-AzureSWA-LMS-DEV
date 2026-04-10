import { normalizeAccordionPayload } from '@lms/block-registry';
import type { AccordionPayload } from '@lms/block-registry';
import styles from './AccordionBlockEditor.module.css';

interface AccordionBlockEditorProps {
  payload: AccordionPayload;
  onChange: (payload: AccordionPayload) => void;
}

export default function AccordionBlockEditor({ payload, onChange }: AccordionBlockEditorProps) {
  const normalized = normalizeAccordionPayload(payload);

  return (
    <div className={styles.editor}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="accordion-title">Block title</label>
        <input
          id="accordion-title"
          className={styles.input}
          type="text"
          value={normalized.title ?? ''}
          placeholder="Optional heading above the accordion"
          onChange={(event) => onChange({ ...normalized, title: event.target.value })}
        />
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={normalized.visible !== false}
          onChange={(event) => onChange({ ...normalized, visible: event.target.checked })}
        />
        <span>Visible on published page</span>
      </label>

      <p className={styles.help}>
        Edit panel names, order, and content directly in the accordion block on the canvas.
      </p>
    </div>
  );
}
