import styles from './SocialProof.module.css'

interface Testimonial {
  quote: string
  name: string
  role: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'The SharePoint path transformed how our team manages documents. Clear, practical, and immediately useful.',
    name: 'Sarah M.',
    role: 'Office Manager',
    initials: 'SM',
  },
  {
    quote:
      'I went from barely using Teams to running all my project meetings through it. Worth every minute.',
    name: 'James T.',
    role: 'Project Coordinator',
    initials: 'JT',
  },
  {
    quote:
      'Finally, training that matches how IT professionals actually work \u2014 not just checkbox compliance.',
    name: 'Priya K.',
    role: 'IT Administrator',
    initials: 'PK',
  },
]

export function SocialProof() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>What learners say</h2>
        <div className={styles.grid}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={styles.card}>
              <blockquote className={styles.quote}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className={styles.attribution}>
                <div className={styles.avatar}>{t.initials}</div>
                <div>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.role}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
