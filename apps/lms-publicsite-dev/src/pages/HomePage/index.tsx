import { Hero } from './Hero'
import { FeatureGrid } from './FeatureGrid'
import { KBTeaser } from './KBTeaser'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Hero />
      <FeatureGrid />
      <KBTeaser />
    </div>
  )
}