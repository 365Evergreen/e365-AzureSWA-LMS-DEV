import { useState } from 'react';
import type { HeroPayload } from '@lms/block-registry';
import MediaPickerModal from '../MediaPickerModal';
import type { MediaItem } from '../../api/media';
import styles from './HeroBlockEditor.module.css';

interface HeroBlockEditorProps {
  payload: HeroPayload;
  onChange: (payload: HeroPayload) => void;
}

const LAYOUT_OPTIONS: { value: HeroPayload['layout']; label: string; icon: string }[] = [
  { value: 'left', label: 'Left', icon: '⬛◻◻' },
  { value: 'center', label: 'Centre', icon: '◻⬛◻' },
  { value: 'right', label: 'Right', icon: '◻◻⬛' },
];

const HEIGHT_OPTIONS: { value: HeroPayload['height']; label: string; sub: string }[] = [
  { value: 'small', label: 'Small', sub: '25vw' },
  { value: 'medium', label: 'Medium', sub: '50vw' },
  { value: 'large', label: 'Large', sub: '75vw' },
  { value: 'full', label: 'Full', sub: '100vw' },
];

export default function HeroBlockEditor({ payload, onChange }: HeroBlockEditorProps) {
  const [bgPickerOpen, setBgPickerOpen] = useState(false);

  function update<K extends keyof HeroPayload>(key: K, value: HeroPayload[K]) {
    onChange({ ...payload, [key]: value });
  }

  function handleBgSelect(item: MediaItem) {
    update('backgroundImage', item.url);
  }

  return (
    <div className={styles.editor}>
      {/* Layout */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Layout</p>
        <div className={styles.pillRow}>
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.pill} ${payload.layout === opt.value ? styles.pillActive : ''}`}
              onClick={() => update('layout', opt.value)}
              title={opt.label}
            >
              <span className={styles.pillIcon}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Height</p>
        <div className={styles.pillRow}>
          {HEIGHT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.pill} ${payload.height === opt.value ? styles.pillActive : ''}`}
              onClick={() => update('height', opt.value)}
            >
              <span>{opt.label}</span>
              <span className={styles.pillSub}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Content</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="hero-heading">Heading</label>
          <input
            id="hero-heading"
            className={styles.input}
            type="text"
            placeholder="Hero heading"
            value={payload.heading ?? ''}
            onChange={(e) => update('heading', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="hero-subheading">Subheading</label>
          <input
            id="hero-subheading"
            className={styles.input}
            type="text"
            placeholder="Optional subheading"
            value={payload.subheading ?? ''}
            onChange={(e) => update('subheading', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="hero-body">Body text</label>
          <textarea
            id="hero-body"
            className={styles.textarea}
            placeholder="Optional body paragraph"
            rows={3}
            value={payload.body ?? ''}
            onChange={(e) => update('body', e.target.value)}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hero-cta-label">CTA label</label>
            <input
              id="hero-cta-label"
              className={styles.input}
              type="text"
              placeholder="Get started"
              value={payload.ctaLabel ?? ''}
              onChange={(e) => update('ctaLabel', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hero-cta-url">CTA URL</label>
            <input
              id="hero-cta-url"
              className={styles.input}
              type="url"
              placeholder="https://…"
              value={payload.ctaUrl ?? ''}
              onChange={(e) => update('ctaUrl', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Background */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Background</p>

        <div className={styles.field}>
          <label className={styles.label}>Background image</label>
          <div className={styles.srcRow}>
            <input
              className={styles.input}
              type="url"
              placeholder="https://…"
              value={payload.backgroundImage ?? ''}
              onChange={(e) => update('backgroundImage', e.target.value)}
            />
            <button type="button" className={styles.pickBtn} onClick={() => setBgPickerOpen(true)}>
              Browse
            </button>
          </div>
          {payload.backgroundImage && (
            <img
              src={payload.backgroundImage}
              alt="Background preview"
              className={styles.preview}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="hero-overlay">
            Overlay opacity: {payload.overlayOpacity ?? 0}%
          </label>
          <input
            id="hero-overlay"
            type="range"
            min={0}
            max={100}
            step={5}
            className={styles.range}
            value={payload.overlayOpacity ?? 0}
            onChange={(e) => update('overlayOpacity', Number(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="hero-bg-color">Background colour (fallback)</label>
          <div className={styles.colorRow}>
            <input
              id="hero-bg-color"
              type="color"
              className={styles.colorPicker}
              value={payload.backgroundColor ?? '#1a1a2e'}
              onChange={(e) => update('backgroundColor', e.target.value)}
            />
            <input
              className={styles.input}
              type="text"
              value={payload.backgroundColor ?? '#1a1a2e'}
              onChange={(e) => update('backgroundColor', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Text colour */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Text colour</p>
        <div className={styles.pillRow}>
          <button
            type="button"
            className={`${styles.pill} ${styles.pillLight} ${payload.textColor !== 'dark' ? styles.pillActive : ''}`}
            onClick={() => update('textColor', 'light')}
          >
            Light
          </button>
          <button
            type="button"
            className={`${styles.pill} ${styles.pillDark} ${payload.textColor === 'dark' ? styles.pillActive : ''}`}
            onClick={() => update('textColor', 'dark')}
          >
            Dark
          </button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={bgPickerOpen}
        onClose={() => setBgPickerOpen(false)}
        onSelect={handleBgSelect}
        filter="image"
        title="Select Background Image"
      />
    </div>
  );
}
