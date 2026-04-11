import type { BlockRendererProps } from '@lms/block-registry';
import styles from './CodeBlock.module.css';

interface CodePayload {
  code: string;
  language: string;
  filename?: string;
}

export function CodeBlock({ payload }: BlockRendererProps<CodePayload>) {
  return (
    <div className={styles.wrapper}>
      {payload.filename && (
        <div className={styles.filename}>{payload.filename}</div>
      )}
      <pre className={styles.pre}>
        <code className={`${styles.code} language-${payload.language}`}>
          {payload.code}
        </code>
      </pre>
    </div>
  );
}
