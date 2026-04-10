'use client';

import styles from './ProfileBanner.module.css';

interface ProfileBannerProps {
  name: string;
  email: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProfileBanner({ name, email }: ProfileBannerProps) {
  const initials = getInitials(name);

  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <div className={styles.avatar} aria-hidden="true">
          {initials}
        </div>
        <div className={styles.identity}>
          <span className={styles.name}>{name}</span>
          <span className={styles.email}>{email}</span>
        </div>
      </div>
      <div className={styles.decoration} aria-hidden="true">
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
        <div className={styles.shape4} />
      </div>
    </div>
  );
}
