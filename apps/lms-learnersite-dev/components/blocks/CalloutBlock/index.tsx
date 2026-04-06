import type { BlockRendererProps } from '@lms/block-registry';
import styles from './CalloutBlock.module.css';

interface CalloutPayload {
  type: 'info' | 'warning' | 'danger' | 'tip';
  title?: string;
  body: string;
}

const typeClass: Record<CalloutPayload['type'], string> = {
  info: styles.info,
  warning: styles.warning,
  danger: styles.danger,
  tip: styles.tip,
};

const typeIcon: Record<CalloutPayload['type'], string> = {
  info: 'ℹ️',
  warning: '⚠️',
  danger: '🚨',
  tip: '💡',
};

export function CalloutBlock({ payload }: BlockRendererProps<CalloutPayload>) {
  return (
    <aside className={`${styles.callout} ${typeClass[payload.type]}`}>
      <span className={styles.icon} aria-hidden="true">
        {typeIcon[payload.type]}
      </span>
      <div className={styles.content}>
        {payload.title && <p className={styles.title}>{payload.title}</p>}
        <p className={styles.body}>{payload.body}</p>
      </div>
    </aside>
  );
}
