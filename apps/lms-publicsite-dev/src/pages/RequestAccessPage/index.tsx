import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiBase } from '../../api/apiBase'
import styles from './RequestAccessPage.module.css'

interface FormState {
  firstName: string
  lastName: string
  email: string
  organisation: string
  course: string
  notes: string
}

type PageState = 'form' | 'submitting' | 'success' | 'conflict'

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  organisation: '',
  course: '',
  notes: '',
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function RequestAccessPage() {
  const [searchParams] = useSearchParams()
  const courseParam = searchParams.get('course') ?? ''

  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, course: courseParam })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [pageState, setPageState] = useState<PageState>('form')
  const [conflictResetUrl, setConflictResetUrl] = useState<string | null>(null)

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.firstName.trim()) next.firstName = 'First name is required'
    if (!form.lastName.trim()) next.lastName = 'Last name is required'
    if (!form.email.trim()) {
      next.email = 'Email is required'
    } else if (!isValidEmail(form.email.trim())) {
      next.email = 'Please enter a valid email address'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setPageState('submitting')

    const fields = [
      { id: 'first-name', label: 'First name', type: 'text', value: form.firstName.trim(), required: true },
      { id: 'last-name', label: 'Last name', type: 'text', value: form.lastName.trim(), required: true },
      { id: 'email', label: 'Work email', type: 'email', value: form.email.trim(), required: true },
      ...(form.organisation.trim()
        ? [{ id: 'organisation', label: 'Organisation', type: 'text', value: form.organisation.trim() }]
        : []),
      ...(form.course.trim()
        ? [{ id: 'course', label: 'Interested in course', type: 'text', value: form.course.trim() }]
        : []),
      ...(form.notes.trim()
        ? [{ id: 'notes', label: 'Notes', type: 'textarea', value: form.notes.trim() }]
        : []),
    ]

    try {
      const res = await fetch(`${apiBase()}/api/signup-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath: '/request-access',
          formTitle: 'Request Access',
          fields,
        }),
      })

      if (res.status === 409) {
        const data = await res.json() as { resetPasswordUrl?: string }
        setConflictResetUrl(data.resetPasswordUrl ?? null)
        setPageState('conflict')
        return
      }

      if (!res.ok) throw new Error(`Unexpected response: ${res.status}`)
      setPageState('success')
    } catch {
      setPageState('form')
      setErrors({ email: 'Something went wrong. Please try again.' })
    }
  }

  if (pageState === 'success') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon} aria-hidden="true">✓</div>
          <h1 className={styles.successHeading}>Request received</h1>
          <p className={styles.successText}>
            Thank you, {form.firstName}. We&rsquo;ve sent a confirmation email to <strong>{form.email}</strong>.
          </p>
          <p className={styles.successText}>
            Once your request is reviewed, you&rsquo;ll receive an invitation email to complete
            sign-in and begin learning.
          </p>
          <a href="/" className={styles.homeLink}>Back to home</a>
        </div>
      </div>
    )
  }

  if (pageState === 'conflict') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.heading}>Account already exists</h1>
          <p className={styles.conflictText}>
            An account is already registered for that email address. If you&rsquo;re having
            trouble signing in, you can reset your password.
          </p>
          {conflictResetUrl && (
            <a href={conflictResetUrl} className={styles.ctaLink}>
              Reset password
            </a>
          )}
          <a href="/" className={styles.homeLink}>Back to home</a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.formHeader}>
          <h1 className={styles.heading}>Request access</h1>
          <p className={styles.subheading}>
            Fill in your details below and we&rsquo;ll review your request. Once approved,
            you&rsquo;ll receive an email invitation to start learning.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="firstName">
                First name <span className={styles.required} aria-hidden="true">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                autoComplete="given-name"
                aria-required="true"
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <p id="firstName-error" className={styles.errorMsg} role="alert">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="lastName">
                Last name <span className={styles.required} aria-hidden="true">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                autoComplete="family-name"
                aria-required="true"
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <p id="lastName-error" className={styles.errorMsg} role="alert">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Work email <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              autoComplete="email"
              inputMode="email"
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className={styles.errorMsg} role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="organisation">
              Organisation
            </label>
            <input
              id="organisation"
              type="text"
              className={styles.input}
              value={form.organisation}
              onChange={(e) => handleChange('organisation', e.target.value)}
              autoComplete="organization"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="course">
              Interested in course
            </label>
            <input
              id="course"
              type="text"
              className={styles.input}
              value={form.course}
              onChange={(e) => handleChange('course', e.target.value)}
              placeholder="e.g. Introduction to Leadership"
              readOnly={!!courseParam}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className={`${styles.input} ${styles.textarea}`}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder="Anything else you'd like us to know"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={pageState === 'submitting'}
          >
            {pageState === 'submitting' ? 'Sending…' : 'Send request'}
          </button>
        </form>
      </div>
    </div>
  )
}
