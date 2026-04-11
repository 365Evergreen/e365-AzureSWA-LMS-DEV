import type { BlockRendererProps } from '@lms/block-registry';
import styles from './ImageBlock.module.css';

interface ImagePayload {
  src: string;
  alt: string;
  caption?: string;
}

export function ImageBlock({ payload }: BlockRendererProps<ImagePayload>) {
  return (
    <figure className={styles.figure}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={payload.src} alt={payload.alt} className={styles.image} />
      {payload.caption && (
        <figcaption className={styles.caption}>{payload.caption}</figcaption>
      )}
    </figure>
  );
}
