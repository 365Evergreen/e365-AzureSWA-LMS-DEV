import type { BlockRendererProps } from '@lms/block-registry';
import styles from './DividerBlock.module.css';

export function DividerBlock(_props: BlockRendererProps<Record<string, never>>) {
  return <hr className={styles.divider} />;
}
