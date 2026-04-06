import type { BlockRendererProps } from '@lms/block-registry';
import styles from './VideoBlock.module.css';

interface VideoPayload {
  src: string;
  title: string;
  posterSrc?: string;
}

export function VideoBlock({ payload }: BlockRendererProps<VideoPayload>) {
  return (
    <div className={styles.wrapper}>
      <video
        src={payload.src}
        poster={payload.posterSrc}
        controls
        className={styles.video}
        title={payload.title}
      >
        <p className={styles.fallback}>
          Your browser does not support HTML video.{' '}
          <a href={payload.src}>Download the video</a>.
        </p>
      </video>
      <p className={styles.title}>{payload.title}</p>
    </div>
  );
}
