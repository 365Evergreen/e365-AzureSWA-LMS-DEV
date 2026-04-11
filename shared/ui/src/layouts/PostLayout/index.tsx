import type { ReactNode } from 'react';
import styles from './PostLayout.module.css';

export interface PostMetadata {
  title?: string;
  date?: string;
  tags?: string[];
  author?: string;
}

export interface PostLayoutProps {
  children: ReactNode;
  metadata?: PostMetadata;
}

export function PostLayout({ children, metadata }: PostLayoutProps) {
  return (
    <div className={styles.root}>
      {metadata && (
        <header className={styles.header}>
          {metadata.date && (
            <time className={styles.date} dateTime={metadata.date}>
              {new Date(metadata.date).toLocaleDateString('en-AU', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </time>
          )}
          {metadata.title && <h1 className={styles.title}>{metadata.title}</h1>}
          {metadata.author && <p className={styles.author}>By {metadata.author}</p>}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className={styles.tags}>
              {metadata.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
