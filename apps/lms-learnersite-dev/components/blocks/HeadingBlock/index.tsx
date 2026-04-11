import type { BlockRendererProps } from '@lms/block-registry';
import styles from './HeadingBlock.module.css';

interface HeadingPayload {
  text: string;
  level: 1 | 2 | 3 | 4;
}

const levelClass: Record<number, string> = {
  1: styles.h1,
  2: styles.h2,
  3: styles.h3,
  4: styles.h4,
};

export function HeadingBlock({ payload }: BlockRendererProps<HeadingPayload>) {
  const Tag = `h${payload.level}` as 'h1' | 'h2' | 'h3' | 'h4';
  return <Tag className={levelClass[payload.level]}>{payload.text}</Tag>;
}
