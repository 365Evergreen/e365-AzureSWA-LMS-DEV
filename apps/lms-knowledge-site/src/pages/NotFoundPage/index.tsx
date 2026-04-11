import { Link } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>404 – Page Not Found</h1>
        <p className={styles.message}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/articles" className={styles.link}>← Back to Articles</Link>
      </div>
    </Layout>
  )
}
