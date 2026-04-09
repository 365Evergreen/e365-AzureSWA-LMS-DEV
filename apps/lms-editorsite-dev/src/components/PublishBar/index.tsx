import { useState } from 'react';
import { useAuth } from '@lms/shared-auth';
import { msalInstance } from '../../auth/msalConfig';
import ConfirmModal from '../ConfirmModal';
import styles from './PublishBar.module.css';

type PublishStatus = 'draft' | 'published';

interface PublishBarProps {
  status: PublishStatus;
  /** Save as draft or publish. */
  onSave: (status: PublishStatus) => Promise<void>;
  /** Called after the user confirms discard — should navigate away. */
  onDiscard?: () => void;
  /** Called after the user confirms delete — should mark deleted then navigate away. */
  onDelete?: () => Promise<void>;
}

type ModalVariant = 'publish' | 'discard' | 'delete' | null;

const MODAL_CONFIG: Record<
  NonNullable<ModalVariant>,
  { title: string; message: string; confirmLabel: string; confirmVariant: 'danger' | 'primary' }
> = {
  publish: {
    title: 'Publish this page?',
    message: 'This will make the page publicly visible immediately. You can unpublish it at any time.',
    confirmLabel: 'Publish',
    confirmVariant: 'primary',
  },
  discard: {
    title: 'Discard changes?',
    message: 'All unsaved changes will be lost. This cannot be undone.',
    confirmLabel: 'Discard changes',
    confirmVariant: 'danger',
  },
  delete: {
    title: 'Delete this page?',
    message:
      'The page will be marked as deleted and removed from the public site. No content is permanently deleted — drafts are recoverable for 14 days and published content remains accessible read-only from the archive.',
    confirmLabel: 'Delete',
    confirmVariant: 'danger',
  },
};

export default function PublishBar({ status, onSave, onDiscard, onDelete }: PublishBarProps) {
  const { user } = useAuth(msalInstance);
  const canPublish = user?.roles.some((r) => r === 'ContentEditor') ?? false;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalVariant>(null);

  async function handleSaveDraft() {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave('draft');
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmPublish() {
    setModal(null);
    setSaving(true);
    setSaveError(null);
    try {
      await onSave('published');
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSaving(false);
    }
  }

  function handleConfirmDiscard() {
    setModal(null);
    onDiscard?.();
  }

  async function handleConfirmDelete() {
    setModal(null);
    setSaving(true);
    setSaveError(null);
    try {
      await onDelete?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  const activeModal = modal ? MODAL_CONFIG[modal] : null;

  return (
    <>
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
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>

          {canPublish && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setModal('publish')}
              disabled={saving}
            >
              Publish
            </button>
          )}

          <div className={styles.separator} />

          {onDiscard && (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setModal('discard')}
              disabled={saving}
            >
              Discard changes
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className={`${styles.ghostBtn} ${styles.dangerBtn}`}
              onClick={() => setModal('delete')}
              disabled={saving}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {activeModal && (
        <ConfirmModal
          isOpen={true}
          title={activeModal.title}
          message={activeModal.message}
          confirmLabel={activeModal.confirmLabel}
          confirmVariant={activeModal.confirmVariant}
          onCancel={() => setModal(null)}
          onConfirm={
            modal === 'publish'
              ? handleConfirmPublish
              : modal === 'discard'
              ? handleConfirmDiscard
              : handleConfirmDelete
          }
        />
      )}
    </>
  );
}
