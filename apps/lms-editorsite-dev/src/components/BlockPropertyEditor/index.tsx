import { getBlock } from '@lms/block-registry';
import type { BlockType } from '@lms/block-registry';
import styles from './BlockPropertyEditor.module.css';

interface PropertyBlock {
  id: string;
  type: BlockType;
  payload: unknown;
}

interface BlockPropertyEditorProps {
  block: PropertyBlock | null;
  onUpdatePayload: (payload: unknown) => void;
}

export default function BlockPropertyEditor({ block, onUpdatePayload }: BlockPropertyEditorProps) {
  if (!block) {
    return (
      <div className={styles.empty}>
        <p>Select a block to edit properties</p>
      </div>
    );
  }

  const def = getBlock(block.type);
  const jsonValue = JSON.stringify(block.payload, null, 2);

  function handleChange(value: string) {
    try {
      const parsed: unknown = JSON.parse(value);
      onUpdatePayload(parsed);
    } catch {
      // ignore invalid JSON while user is typing
    }
  }

  return (
    <div className={styles.editor}>
      <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
      <label className={styles.label} htmlFor="block-payload">
        Payload (JSON)
      </label>
      <textarea
        id="block-payload"
        className={styles.textarea}
        value={jsonValue}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
        rows={12}
      />
    </div>
  );
}
