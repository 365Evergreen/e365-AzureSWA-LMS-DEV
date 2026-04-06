import { getAllBlocks, getBlock } from '@lms/block-registry';
import type { BlockType } from '@lms/block-registry';
import styles from './BlockPalette.module.css';

interface BlockPaletteProps {
  onAddBlock: (type: BlockType, payload: unknown) => void;
}

export default function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const blocks = getAllBlocks();

  function handleClick(type: BlockType) {
    const def = getBlock(type);
    if (def) {
      onAddBlock(type, def.defaultPayload);
    }
  }

  return (
    <div className={styles.palette}>
      <h2 className={styles.heading}>Blocks</h2>
      <ul className={styles.list}>
        {blocks.map((def) => (
          <li key={def.type}>
            <button
              type="button"
              className={styles.item}
              onClick={() => handleClick(def.type)}
            >
              <span className={styles.icon}>{def.icon}</span>
              <span className={styles.label}>{def.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
