import { Link } from 'react-router-dom'
import styles from './AudienceCards.module.css'

interface AudienceCard {
  icon: string
  title: string
  description: string
  href: string
}

const CARDS: AudienceCard[] = [
  {
    icon: '💼',
    title: 'IT Professionals',
    description: 'Deploy, configure, and secure Microsoft 365 across your organisation.',
    href: '/catalogue?role=it-pro',
  },
  {
    icon: '👤',
    title: 'End Users',
    description: 'Get confident with Teams, SharePoint, and the everyday tools you use.',
    href: '/catalogue?role=end-user',
  },
  {
    icon: '📊',
    title: 'Managers & Leaders',
    description: 'Lead with data, communicate better, and drive team performance.',
    href: '/catalogue?role=manager',
  },
]

export function AudienceCards() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Who is this for?</h2>
        <p className={styles.subheading}>
          Learning paths tailored to how you actually use Microsoft 365.
        </p>
        <div className={styles.grid}>
          {CARDS.map((card) => (
            <Link key={card.title} to={card.href} className={styles.card}>
              <div className={styles.icon}>{card.icon}</div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
              <span className={styles.cardLink}>
                View paths <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
