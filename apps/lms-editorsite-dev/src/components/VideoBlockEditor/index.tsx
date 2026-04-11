import { useState } from 'react';
import MediaPickerModal from '../MediaPickerModal';
import type { MediaItem } from '../../api/media';
import styles from './VideoBlockEditor.module.css';

interface VideoPayload {
  src: string;
  title: string;
  posterSrc?: string;
}

interface VideoBlockEditorProps {
  payload: VideoPayload;
  onChange: (payload: VideoPayload) => void;
}

export default function VideoBlockEditor({ payload, onChange }: VideoBlockEditorProps) {
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [posterPickerOpen, setPosterPickerOpen] = useState(false);

  function update<K extends keyof VideoPayload>(key: K, value: VideoPayload[K]) {
    onChange({ ...payload, [key]: value });
  }

  function handleSelectVideo(item: MediaItem) {
    onChange({ ...payload, src: item.url, title: payload.title || item.name });
  }

  function handleSelectPoster(item: MediaItem) {
    onChange({ ...payload, posterSrc: item.url });
  }

  return (
    <div className={styles.editor}>
      <h2 className={styles.heading}>Video</h2>

      <div className={styles.field}>
        <label className={styles.label}>Video file</label>
        <div className={styles.srcRow}>
          <input
            className={styles.input}
            type="url"
            placeholder="https://…"
            value={payload.src}
            onChange={(e) => update('src', e.target.value)}
          />
          <button
            type="button"
            className={styles.pickBtn}
            onClick={() => setVideoPickerOpen(true)}
          >
            Browse
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="vid-title">Title</label>
        <input
          id="vid-title"
          className={styles.input}
          type="text"
          placeholder="Video title"
          value={payload.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Poster image</label>
        <div className={styles.srcRow}>
          <input
            className={styles.input}
            type="url"
            placeholder="Optional thumbnail URL"
            value={payload.posterSrc ?? ''}
            onChange={(e) => update('posterSrc', e.target.value || undefined)}
          />
          <button
            type="button"
            className={styles.pickBtn}
            onClick={() => setPosterPickerOpen(true)}
          >
            Browse
          </button>
        </div>
        {payload.posterSrc && (
          <img
            src={payload.posterSrc}
            alt="Video poster"
            className={styles.preview}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      <MediaPickerModal
        isOpen={videoPickerOpen}
        onClose={() => setVideoPickerOpen(false)}
        onSelect={handleSelectVideo}
        filter="video"
        title="Select Video"
      />
      <MediaPickerModal
        isOpen={posterPickerOpen}
        onClose={() => setPosterPickerOpen(false)}
        onSelect={handleSelectPoster}
        filter="image"
        title="Select Poster Image"
      />
    </div>
  );
}
