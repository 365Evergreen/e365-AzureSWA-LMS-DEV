import { useState } from 'react';
import { getAllGroups, getBlocksByGroup, getBlock } from '@lms/block-registry';
import type { BlockType, BlockGroup } from '@lms/block-registry';
import styles from './BlockPalette.module.css';

interface BlockPaletteProps {
  onAddBlock: (type: BlockType, payload: unknown) => void;
}

export default function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const groups = getAllGroups();
  const [collapsed, setCollapsed] = useState<Partial<Record<BlockGroup, boolean>>>({});

  function toggleGroup(group: BlockGroup) {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  function handleClick(type: BlockType) {
    const def = getBlock(type);
    if (def) onAddBlock(type, def.defaultPayload);
  }

  return (
    <div className={styles.palette}>
      <h2 className={styles.heading}>Blocks</h2>
      {groups.map((group) => {
        const blocks = getBlocksByGroup(group);
        const isCollapsed = !!collapsed[group];
        return (
          <div key={group} className={styles.group}>
            <button
              type="button"
              className={styles.groupHeader}
              onClick={() => toggleGroup(group)}
              aria-expanded={!isCollapsed}
            >
              <span className={styles.groupLabel}>{group}</span>
              <span className={styles.groupChevron}>{isCollapsed ? '›' : '⌄'}</span>
            </button>
            {!isCollapsed && (
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
            )}
          </div>
        );
      })}
    </div>
  );
}
