'use client';

import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  enrolled: boolean;
}

export function StatusBadge({ enrolled }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${enrolled ? styles.enrolled : styles.notEnrolled}`}>
      {enrolled ? 'Enrolled' : 'Not enrolled'}
    </span>
  );
}
