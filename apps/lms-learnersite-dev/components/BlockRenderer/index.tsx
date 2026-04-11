'use client';

import { getBlock, BlockType, isRegisteredBlockType } from '@lms/block-registry';
import styles from './BlockRenderer.module.css';

interface BlockRendererProps {
  block: {
    id: string;
    type: string;
    payload: unknown;
  };
}

export function BlockRenderer({ block }: BlockRendererProps) {
  if (!isRegisteredBlockType(block.type)) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.unknown}>
          Unknown block type: <code>{block.type}</code>
        </div>
      </div>
    );
  }

  const definition = getBlock(block.type as BlockType);
  if (!definition) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.unknown}>
          No renderer registered for block type: <code>{block.type}</code>
        </div>
      </div>
    );
  }

  const { Renderer } = definition;
  return (
    <div className={styles.wrapper}>
      <Renderer payload={block.payload} blockId={block.id} />
    </div>
  );
}
