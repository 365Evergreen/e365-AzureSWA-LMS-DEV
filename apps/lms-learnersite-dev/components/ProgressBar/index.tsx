'use client';

import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0-100
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={styles.container} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={styles.track}>
        {/* Inline style is acceptable here: dynamic numeric value */}
        <div className={styles.fill} style={{ width: `${clamped}%` }} />
      </div>
      <span className={styles.label}>{clamped}% complete</span>
    </div>
  );
}
