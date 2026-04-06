import { Button } from '@lms/shared-ui';
import { useAuth } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import styles from './PublishBar.module.css';

type PublishStatus = 'draft' | 'review' | 'published';

interface PublishBarProps {
  status: PublishStatus;
  onStatusChange: (status: PublishStatus) => void;
}

export default function PublishBar({ status, onStatusChange }: PublishBarProps) {
  const { user } = useAuth(msalInstance);
  const canPublish = user?.roles.some((r) => r === 'Publisher' || r === 'Admin') ?? false;

  return (
    <div className={styles.bar}>
      <div className={styles.statusGroup}>
        <span className={`${styles.pill} ${styles[status]}`}>
          {status === 'draft' && 'Draft'}
          {status === 'review' && 'In Review'}
          {status === 'published' && 'Published'}
        </span>
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={() => onStatusChange('draft')}>
          Save Draft
        </Button>
        {status === 'draft' && (
          <Button variant="secondary" size="sm" onClick={() => onStatusChange('review')}>
            Submit for Review
          </Button>
        )}
        {status === 'review' && canPublish && (
          <Button variant="primary" size="sm" onClick={() => onStatusChange('published')}>
            Publish
          </Button>
        )}
        {status === 'published' && (
          <Button variant="primary" size="sm" disabled>
            Published
          </Button>
        )}
      </div>
    </div>
  );
}
