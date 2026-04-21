import { useEffect, useMemo, useState } from 'react';
import { Button } from '@lms/shared-ui';
import {
  loadEditorModuleAssessment,
  saveModuleAssessment,
  type SaveModuleAssessmentRequest,
} from '../../api/catalogue';
import styles from './ModuleAssessmentModal.module.css';

type EditableAnswer = {
  optionId?: string;
  label: string;
  isCorrect: boolean;
  sortOrder: number;
};

type EditableQuestion = {
  questionId?: string;
  prompt: string;
  sortOrder: number;
  allowsMultiple: boolean;
  options: EditableAnswer[];
};

interface ModuleAssessmentModalProps {
  isOpen: boolean;
  moduleId: string | null;
  moduleTitle?: string;
  onClose: () => void;
  onSaved?: () => void;
}

function createEmptyAnswer(sortOrder: number): EditableAnswer {
  return {
    label: '',
    isCorrect: false,
    sortOrder,
  };
}

function createEmptyQuestion(sortOrder: number): EditableQuestion {
  return {
    prompt: '',
    sortOrder,
    allowsMultiple: false,
    options: [createEmptyAnswer(10), createEmptyAnswer(20)],
  };
}

function normalizeQuestionsForEditor(
  questions: Array<{
    questionId?: string;
    prompt: string;
    sortOrder: number;
    allowsMultiple: boolean;
    options: Array<{
      optionId?: string;
      label: string;
      isCorrect: boolean;
      sortOrder: number;
    }>;
  }>,
): EditableQuestion[] {
  if (questions.length === 0) {
    return [createEmptyQuestion(10)];
  }

  return questions
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((question) => ({
      questionId: question.questionId,
      prompt: question.prompt,
      sortOrder: question.sortOrder,
      allowsMultiple: question.allowsMultiple,
      options: question.options.length > 0
        ? question.options
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((option) => ({
            optionId: option.optionId,
            label: option.label,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder,
          }))
        : [createEmptyAnswer(10), createEmptyAnswer(20)],
    }));
}

function validateQuestions(questions: EditableQuestion[]): string | null {
  if (questions.length === 0) {
    return 'Add at least one question.';
  }

  for (const [index, question] of questions.entries()) {
    if (!question.prompt.trim()) {
      return `Question ${index + 1} needs text.`;
    }
    if (question.options.length < 2) {
      return `Question ${index + 1} needs at least two answers.`;
    }
    if (question.options.some((option) => !option.label.trim())) {
      return `Question ${index + 1} has an empty answer option.`;
    }

    const correctCount = question.options.filter((option) => option.isCorrect).length;
    if (!question.allowsMultiple && correctCount !== 1) {
      return `Question ${index + 1} must have exactly one correct answer.`;
    }
    if (question.allowsMultiple && correctCount < 2) {
      return `Question ${index + 1} must have at least two correct answers.`;
    }
  }

  return null;
}

export default function ModuleAssessmentModal({
  isOpen,
  moduleId,
  moduleTitle,
  onClose,
  onSaved,
}: ModuleAssessmentModalProps) {
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !moduleId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadEditorModuleAssessment(moduleId)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        setQuestions(normalizeQuestionsForEditor(detail.questions));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load assessment.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, moduleId]);

  const validationError = useMemo(() => validateQuestions(questions), [questions]);

  if (!isOpen || !moduleId) {
    return null;
  }

  function updateQuestion(index: number, next: Partial<EditableQuestion>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...next } : question,
      ),
    );
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      createEmptyQuestion((current.length + 1) * 10),
    ]);
  }

  function updateAnswer(questionIndex: number, answerIndex: number, next: Partial<EditableAnswer>) {
    setQuestions((current) =>
      current.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }
        return {
          ...question,
          options: question.options.map((option, oIndex) =>
            oIndex === answerIndex ? { ...option, ...next } : option,
          ),
        };
      }),
    );
  }

  function addAnswer(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }
        return {
          ...question,
          options: [
            ...question.options,
            createEmptyAnswer((question.options.length + 1) * 10),
          ],
        };
      }),
    );
  }

  function removeAnswer(questionIndex: number, answerIndex: number) {
    setQuestions((current) =>
      current.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }
        return {
          ...question,
          options: question.options.filter((_, oIndex) => oIndex !== answerIndex),
        };
      }),
    );
  }

  function toggleCorrectAnswer(questionIndex: number, answerIndex: number) {
    setQuestions((current) =>
      current.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option, oIndex) => {
            if (question.allowsMultiple) {
              return oIndex === answerIndex ? { ...option, isCorrect: !option.isCorrect } : option;
            }

            return {
              ...option,
              isCorrect: oIndex === answerIndex,
            };
          }),
        };
      }),
    );
  }

  function updateQuestionType(questionIndex: number, allowsMultiple: boolean) {
    setQuestions((current) =>
      current.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }

        if (allowsMultiple) {
          return { ...question, allowsMultiple };
        }

        const firstCorrectIndex = question.options.findIndex((option) => option.isCorrect);
        return {
          ...question,
          allowsMultiple,
          options: question.options.map((option, optionIndex) => ({
            ...option,
            isCorrect: firstCorrectIndex === -1 ? optionIndex === 0 && option.isCorrect : optionIndex === firstCorrectIndex,
          })),
        };
      }),
    );
  }

  async function handleSave() {
    if (!moduleId) {
      return;
    }

    const clientError = validateQuestions(questions);
    if (clientError) {
      setError(clientError);
      return;
    }

    setSaving(true);
    setError(null);

    const payload: SaveModuleAssessmentRequest = {
      title: moduleTitle ? `${moduleTitle} assessment` : undefined,
      questions: questions.map((question) => ({
        questionId: question.questionId,
        prompt: question.prompt.trim(),
        allowsMultiple: question.allowsMultiple,
        sortOrder: question.sortOrder,
        options: question.options.map((option) => ({
          optionId: option.optionId,
          label: option.label.trim(),
          isCorrect: option.isCorrect,
          sortOrder: option.sortOrder,
        })),
      })),
    };

    try {
      const detail = await saveModuleAssessment(moduleId, payload);
      setQuestions(normalizeQuestionsForEditor(detail.questions));
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-modal-title"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Module assessment</p>
            <h2 id="assessment-modal-title" className={styles.title}>
              {moduleTitle ? `${moduleTitle} assessment` : 'Assessment editor'}
            </h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close assessment editor">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.state}>Loading assessment…</div>
          ) : (
            <>
              <div className={styles.toolbar}>
                <p className={styles.helpText}>
                  Add questions, choose the answer mode, and mark the correct answers for each question.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  + Add question
                </Button>
              </div>

              <div className={styles.questionList}>
                {questions.map((question, questionIndex) => (
                  <section key={question.questionId ?? `question-${questionIndex}`} className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                      <h3 className={styles.questionTitle}>Question {questionIndex + 1}</h3>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeQuestion(questionIndex)}
                        disabled={questions.length === 1}
                      >
                        Remove
                      </button>
                    </div>

                    <div className={styles.fieldGrid}>
                      <label className={styles.field}>
                        <span className={styles.label}>Question</span>
                        <textarea
                          className={styles.textarea}
                          value={question.prompt}
                          onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })}
                          rows={3}
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.label}>Sort order</span>
                        <input
                          className={styles.input}
                          type="number"
                          min={0}
                          value={question.sortOrder}
                          onChange={(event) => updateQuestion(questionIndex, { sortOrder: Number(event.target.value) || 0 })}
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.label}>Question type</span>
                        <select
                          className={styles.select}
                          value={question.allowsMultiple ? 'multiple' : 'single'}
                          onChange={(event) => updateQuestionType(questionIndex, event.target.value === 'multiple')}
                        >
                          <option value="single">Single correct answer</option>
                          <option value="multiple">Multiple correct answers</option>
                        </select>
                      </label>
                    </div>

                    <div className={styles.answersSection}>
                      <div className={styles.answersHeader}>
                        <h4 className={styles.answersTitle}>Answers</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => addAnswer(questionIndex)}>
                          + Add answer
                        </Button>
                      </div>

                      <div className={styles.answersList}>
                        {question.options.map((option, answerIndex) => (
                          <div key={option.optionId ?? `answer-${answerIndex}`} className={styles.answerRow}>
                            <button
                              type="button"
                              className={option.isCorrect ? styles.correctToggleActive : styles.correctToggle}
                              onClick={() => toggleCorrectAnswer(questionIndex, answerIndex)}
                              aria-pressed={option.isCorrect}
                              title={question.allowsMultiple ? 'Toggle correct answer' : 'Set correct answer'}
                            >
                              {question.allowsMultiple ? (option.isCorrect ? '✓' : '□') : option.isCorrect ? '◉' : '○'}
                            </button>

                            <label className={styles.answerField}>
                              <span className={styles.srOnly}>Answer text</span>
                              <input
                                className={styles.input}
                                value={option.label}
                                onChange={(event) => updateAnswer(questionIndex, answerIndex, { label: event.target.value })}
                                placeholder={`Answer ${answerIndex + 1}`}
                              />
                            </label>

                            <label className={styles.answerSortField}>
                              <span className={styles.srOnly}>Answer sort order</span>
                              <input
                                className={styles.input}
                                type="number"
                                min={0}
                                value={option.sortOrder}
                                onChange={(event) => updateAnswer(questionIndex, answerIndex, { sortOrder: Number(event.target.value) || 0 })}
                              />
                            </label>

                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => removeAnswer(questionIndex, answerIndex)}
                              disabled={question.options.length <= 2}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerStatus}>
            {error ? <span className={styles.error}>{error}</span> : null}
            {!error && !loading && validationError ? <span className={styles.warning}>{validationError}</span> : null}
          </div>
          <div className={styles.footerActions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Saving…' : 'Save assessment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
