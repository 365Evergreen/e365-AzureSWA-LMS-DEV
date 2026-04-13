import styles from './StatusBadge.module.css';

type Status = 'draft' | 'review' | 'published' | 'archived';

interface StatusBadgeProps {
  status: Status;
}

const LABEL: Record<Status, string> = {
  draft: 'Draft',
  review: 'In Review',
  published: 'Published',
  archived: 'Archived',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {LABEL[status]}
    </span>
  );
}
