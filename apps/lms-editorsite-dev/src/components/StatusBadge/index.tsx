import type { Course } from '../../data/courses';
import styles from './StatusBadge.module.css';

type Status = Course['status'];

interface StatusBadgeProps {
  status: Status;
}

const LABEL: Record<Status, string> = {
  draft: 'Draft',
  review: 'In Review',
  published: 'Published',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {LABEL[status]}
    </span>
  );
}
