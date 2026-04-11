import type { BlockRendererProps } from '@lms/block-registry';
import styles from './QuizBlock.module.css';

interface QuizOption {
  id: string;
  label: string;
}

interface QuizPayload {
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
}

export function QuizBlock({ payload, blockId }: BlockRendererProps<QuizPayload>) {
  return (
    <div className={styles.quiz}>
      <p className={styles.question}>{payload.question}</p>
      <ul className={styles.options} role="list">
        {payload.options.map((option) => (
          <li key={option.id} className={styles.option}>
            <label className={styles.label}>
              <input
                type="radio"
                name={`quiz-${blockId}`}
                value={option.id}
                className={styles.radio}
              />
              <span>{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {payload.explanation && (
        <p className={styles.explanation}>{payload.explanation}</p>
      )}
    </div>
  );
}
