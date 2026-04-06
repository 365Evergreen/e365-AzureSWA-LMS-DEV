import type { BlockRendererProps } from '@lms/block-registry';
import styles from './ParagraphBlock.module.css';

interface ParagraphPayload {
  html: string;
}

export function ParagraphBlock({ payload }: BlockRendererProps<ParagraphPayload>) {
  return (
    <div
      className={styles.prose}
      dangerouslySetInnerHTML={{ __html: payload.html }}
    />
  );
}
