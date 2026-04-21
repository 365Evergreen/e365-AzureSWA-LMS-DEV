import { useId, useState } from 'react'
import styles from './CopilotStudioAgent.module.css'

const COPILOT_STUDIO_URL =
  'https://copilotstudio.preview.microsoft.com/environments/7f8e2fb6-3527-e9aa-ab7c-ad9ecce209c7/bots/cref7_resumeJobMatchAssistant/webchat?__version__=2'

export function CopilotStudioAgent() {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  return (
    <div className={styles.root}>
      {isOpen ? (
        <section
          id={panelId}
          className={styles.panel}
          aria-label="Job match assistant"
        >
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Copilot Studio</p>
              <h2 className={styles.title}>Job match assistant</h2>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
            >
              <CloseIcon />
            </button>
          </div>

          <div className={styles.frameShell}>
            <iframe
              src={COPILOT_STUDIO_URL}
              title="Job match assistant"
              className={styles.frame}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className={styles.launcherIcon} aria-hidden="true">
          <SparkleIcon />
        </span>
        <span>{isOpen ? 'Hide assistant' : 'Ask the assistant'}</span>
      </button>
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5l1.7 4.8 4.8 1.7-4.8 1.7L9 14.5l-1.7-4.8-4.8-1.7 4.8-1.7L9 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 1.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4.5 4.5l9 9M13.5 4.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
