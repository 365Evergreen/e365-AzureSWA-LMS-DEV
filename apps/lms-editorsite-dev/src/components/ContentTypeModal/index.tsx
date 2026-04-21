import type { ReactNode } from 'react';
import { WebPagesIcon } from '@lms/shared-ui';
import styles from './ContentTypeModal.module.css';

interface ContentTypeModalProps {
  onSelect: (type: 'page' | 'post') => void;
  onCancel: () => void;
}

const contentTypes = [
  {
    type: 'page' as const,
    label: 'New page',
    description: 'Fairly static content. Choose from landing, content, or search results layouts.',
    icon: <WebPagesIcon />,
  },
  {
    type: 'post' as const,
    label: 'New post',
    description: 'Regularly updated content with metadata for filtering and search.',
    icon: '📄',
  },
] satisfies Array<{
  type: 'page' | 'post';
  label: string;
  description: string;
  icon: ReactNode;
}>;

export default function ContentTypeModal({ onSelect, onCancel }: ContentTypeModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>What are you creating?</h2>
          <p className={styles.subtitle}>
            Choose a content type to get started.
          </p>
        </div>
        <div className={styles.options}>
          {contentTypes.map(({ type, label, description, icon }) => (
            <button
              key={type}
              type="button"
              className={styles.option}
              onClick={() => onSelect(type)}
            >
              <span className={styles.icon} aria-hidden>{icon}</span>
              <div className={styles.optionBody}>
                <span className={styles.optionLabel}>{label}</span>
                <span className={styles.optionDesc}>{description}</span>
              </div>
              <span className={styles.arrow} aria-hidden>→</span>
            </button>
          ))}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
