import { useState, useEffect, useRef } from 'react';
import { listMedia, uploadMedia } from '../../api/media';
import type { MediaItem } from '../../api/media';
import styles from './MediaPickerModal.module.css';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  filter?: 'image' | 'video';
  title?: string;
}

function isImage(item: MediaItem) { return item.contentType.startsWith('image/'); }
function isVideo(item: MediaItem) { return item.contentType.startsWith('video/'); }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  filter,
  title = 'Select Media',
}: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setError(null);
      loadItems();
    }
  }, [isOpen]);

  async function loadItems() {
    setIsLoading(true);
    try {
      setItems(await listMedia());
    } catch {
      setError('Failed to load media');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadMedia));
      setItems((prev) => [...uploaded, ...prev]);
      if (uploaded.length === 1) setSelected(uploaded[0]);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const filtered = items.filter((item) => {
    if (filter === 'image') return isImage(item);
    if (filter === 'video') return isVideo(item);
    return true;
  });

  if (!isOpen) return null;

  const accept =
    filter === 'image' ? 'image/*' : filter === 'video' ? 'video/*' : 'image/*,video/*';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalToolbar}>
          <button
            type="button"
            className={styles.uploadBtn}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? 'Uploading…' : '+ Upload new'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            className={styles.hiddenInput}
            onChange={(e) => handleUpload(e.target.files)}
          />
          {error && <span className={styles.errorText}>{error}</span>}
        </div>

        <div className={styles.grid}>
          {isLoading ? (
            <div className={styles.loading}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No media files yet. Upload one to get started.</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.card} ${selected?.id === item.id ? styles.cardSelected : ''}`}
                onClick={() => setSelected(item)}
                onDoubleClick={() => { onSelect(item); onClose(); }}
              >
                <div className={styles.thumb}>
                  {isImage(item) ? (
                    <img src={item.url} alt={item.name} className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbVideo}>▶</div>
                  )}
                </div>
                <p className={styles.name} title={item.name}>{item.name}</p>
                <p className={styles.meta}>{formatSize(item.size)}</p>
              </button>
            ))
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={styles.selectBtn}
            disabled={!selected}
            onClick={() => { if (selected) { onSelect(selected); onClose(); } }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
