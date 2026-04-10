'use client';

import styles from './ProfileStats.module.css';

interface ProfileStatsProps {
  enrolled: number;
  completed: number;
  inProgress: number;
  learningHours: number;
}

interface StatItemProps {
  value: string;
  label: string;
  accent?: boolean;
}

function StatItem({ value, label, accent }: StatItemProps) {
  return (
    <div className={styles.stat}>
      <span className={`${styles.value} ${accent ? styles.accent : ''}`}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export function ProfileStats({ enrolled, completed, inProgress, learningHours }: ProfileStatsProps) {
  return (
    <div className={styles.bar}>
      <StatItem value={String(enrolled)} label="Enrolled Courses" accent={enrolled > 0} />
      <div className={styles.divider} />
      <StatItem value={String(completed)} label="Completed" accent={completed > 0} />
      <div className={styles.divider} />
      <StatItem value={String(inProgress)} label="In Progress" accent={inProgress > 0} />
      <div className={styles.divider} />
      <StatItem value={`~${learningHours}h`} label="Learning Hours" accent={learningHours > 0} />
    </div>
  );
}
