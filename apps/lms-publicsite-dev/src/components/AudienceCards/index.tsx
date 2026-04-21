import { Link } from 'react-router-dom'
import {
  PersonSettingsRegular,
  PersonRegular,
  DataTrendingRegular,
  type FluentIcon,
} from '@fluentui/react-icons'
import styles from './AudienceCards.module.css'

interface AudienceCard {
  Icon: FluentIcon
  title: string
  description: string
  href: string
}

const CARDS: AudienceCard[] = [
  {
    Icon: PersonSettingsRegular,
    title: 'IT Professionals',
    description: 'Deploy, configure, and secure Microsoft 365 across your organisation.',
    href: '/catalogue?role=it-pro',
  },
  {
    Icon: PersonRegular,
    title: 'End Users',
    description: 'Get confident with Teams, SharePoint, and the everyday tools you use.',
    href: '/catalogue?role=end-user',
  },
  {
    Icon: DataTrendingRegular,
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
              <div className={styles.cardHeader}>
                <div className={styles.icon}>
                  <card.Icon className={styles.iconSvg} />
                </div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
              </div>
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

