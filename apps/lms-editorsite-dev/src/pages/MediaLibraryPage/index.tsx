import { useState, useEffect, useRef } from 'react';
import { listMedia, uploadMedia } from '../../api/media';
import type { MediaItem } from '../../api/media';
import styles from './MediaLibraryPage.module.css';

type FilterType = 'all' | 'image' | 'video';

function isImage(item: MediaItem) { return item.contentType.startsWith('image/'); }
function isVideo(item: MediaItem) { return item.contentType.startsWith('video/'); }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await listMedia());
    } catch {
      setError('Failed to load media library. Check your connection and try again.');
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
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function copyUrl(item: MediaItem) {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = items.filter((item) => {
    if (filter === 'image') return isImage(item);
    if (filter === 'video') return isVideo(item);
    return true;
  });

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Media Library</h1>
            <p className={styles.subtitle}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            className={styles.uploadBtn}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? 'Uploading…' : '+ Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className={styles.hiddenInput}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        <div className={styles.filterBar}>
          {(['all', 'image', 'video'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {isLoading ? (
          <div className={styles.loading}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No {filter === 'all' ? '' : filter + ' '}files yet.</p>
            <p>Click <strong>+ Upload</strong> to add media.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.thumb}>
                  {isImage(item) ? (
                    <img src={item.url} alt={item.name} className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbVideo}>▶</div>
                  )}
                </div>
                <div className={styles.info}>
                  <p className={styles.name} title={item.name}>{item.name}</p>
                  <p className={styles.meta}>{formatSize(item.size)}</p>
                </div>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => copyUrl(item)}
                >
                  {copiedId === item.id ? '✓ Copied' : 'Copy URL'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
