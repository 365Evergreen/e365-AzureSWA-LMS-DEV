import { Hero } from './Hero/Hero'
import { FeatureGrid } from './FeatureGrid/FeatureGrid'
import { KBTeaser } from './KBTeaser/KBTeaser'
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