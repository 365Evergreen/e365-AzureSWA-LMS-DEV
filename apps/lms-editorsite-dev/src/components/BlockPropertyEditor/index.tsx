import { getBlock, BlockType } from '@lms/block-registry';
import type { AccordionPayload, HeroPayload, GridPayload, FormPayload } from '@lms/block-registry';
import AccordionBlockEditor from '../AccordionBlockEditor';
import ImageBlockEditor from '../ImageBlockEditor';
import VideoBlockEditor from '../VideoBlockEditor';
import HeroBlockEditor from '../HeroBlockEditor';
import GridBlockEditor from '../GridBlockEditor';
import FormBlockEditor from '../FormBlockEditor';
import TextBlockPropertyEditor, { isTextBlock } from '../TextBlockPropertyEditor';
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

  if (block.type === BlockType.GRID) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
        <GridBlockEditor
          payload={block.payload as GridPayload}
          onChange={onUpdatePayload}
        />
      </div>
    );
  }

  if (block.type === BlockType.ACCORDION) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
        <AccordionBlockEditor
          payload={block.payload as AccordionPayload}
          onChange={onUpdatePayload}
        />
      </div>
    );
  }

  if (block.type === BlockType.HERO) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
        <HeroBlockEditor
          payload={block.payload as HeroPayload}
          onChange={onUpdatePayload}
        />
      </div>
    );
  }

  if (block.type === BlockType.IMAGE) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
        <ImageBlockEditor
          payload={block.payload as { src: string; alt: string; caption: string }}
          onChange={onUpdatePayload}
        />
      </div>
    );
  }

  if (block.type === BlockType.VIDEO) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
        <VideoBlockEditor
          payload={block.payload as { src: string; title: string; posterSrc?: string }}
          onChange={onUpdatePayload}
        />
      </div>
    );
  }

  if (block.type === BlockType.FORM) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
        <FormBlockEditor
          payload={block.payload as FormPayload}
          onChange={onUpdatePayload}
        />
      </div>
    );
  }

  if (isTextBlock(block.type)) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.heading}>{def?.label ?? block.type}</h2>
        <TextBlockPropertyEditor
          blockType={block.type}
          payload={block.payload as Record<string, unknown>}
          onChange={onUpdatePayload}
        />
      </div>
    );
  }

  // Fallback: raw JSON editor for unimplemented block types
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
