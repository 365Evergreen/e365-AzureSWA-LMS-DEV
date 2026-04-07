import { useState } from 'react';
import { Button } from '@lms/shared-ui';
import { useAuth } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import styles from './PublishBar.module.css';

type PublishStatus = 'draft' | 'published';

interface PublishBarProps {
  status: PublishStatus;
  onSave: (status: PublishStatus) => Promise<void>;
}

export default function PublishBar({ status, onSave }: PublishBarProps) {
  const { user } = useAuth(msalInstance);
  const canPublish = user?.roles.some((r) => r === 'ContentEditor') ?? false;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  async function handleSave(nextStatus: PublishStatus) {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(nextStatus);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.statusGroup}>
        <span className={`${styles.pill} ${styles[status]}`}>
          {status === 'draft' ? 'Draft' : 'Published'}
        </span>
        {lastSaved && !saveError && (
          <span className={styles.savedAt}>Saved {lastSaved}</span>
        )}
        {saveError && (
          <span className={styles.saveError} title={saveError}>⚠ {saveError}</span>
        )}
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={() => handleSave('draft')} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        {canPublish && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            {status === 'published' ? 'Update Published' : 'Publish'}
          </Button>
        )}
      </div>
    </div>
  );
}
