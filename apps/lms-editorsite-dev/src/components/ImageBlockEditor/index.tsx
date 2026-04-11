import { useState } from 'react';
import MediaPickerModal from '../MediaPickerModal';
import type { MediaItem } from '../../api/media';
import styles from './ImageBlockEditor.module.css';

interface ImagePayload {
  src: string;
  alt: string;
  caption: string;
}

interface ImageBlockEditorProps {
  payload: ImagePayload;
  onChange: (payload: ImagePayload) => void;
}

export default function ImageBlockEditor({ payload, onChange }: ImageBlockEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function update<K extends keyof ImagePayload>(key: K, value: ImagePayload[K]) {
    onChange({ ...payload, [key]: value });
  }

  function handleSelect(item: MediaItem) {
    onChange({ ...payload, src: item.url, alt: payload.alt || item.name });
  }

  return (
    <div className={styles.editor}>
      <h2 className={styles.heading}>Image</h2>

      <div className={styles.field}>
        <label className={styles.label}>Source</label>
        <div className={styles.srcRow}>
          <input
            className={styles.input}
            type="url"
            placeholder="https://…"
            value={payload.src}
            onChange={(e) => update('src', e.target.value)}
          />
          <button type="button" className={styles.pickBtn} onClick={() => setPickerOpen(true)}>
            Browse
          </button>
        </div>
        {payload.src && (
          <img
            src={payload.src}
            alt={payload.alt}
            className={styles.preview}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="img-alt">Alt text</label>
        <input
          id="img-alt"
          className={styles.input}
          type="text"
          placeholder="Describe the image for screen readers"
          value={payload.alt}
          onChange={(e) => update('alt', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="img-caption">Caption</label>
        <input
          id="img-caption"
          className={styles.input}
          type="text"
          placeholder="Optional caption"
          value={payload.caption}
          onChange={(e) => update('caption', e.target.value)}
        />
      </div>

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        filter="image"
        title="Select Image"
      />
    </div>
  );
}
