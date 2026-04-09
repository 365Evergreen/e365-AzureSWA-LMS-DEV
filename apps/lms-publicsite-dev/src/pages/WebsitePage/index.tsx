import { useParams, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@lms/shared-ui'
import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import styles from './WebsitePage.module.css'

export default function WebsitePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { metadata, blocks, loading, error } = usePage(slug)

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !metadata) {
    return <Navigate to="/404" replace />
  }

  return (
    <article className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>{metadata.title}</h1>
          {metadata.description && (
            <p className={styles.description}>{metadata.description}</p>
          )}
        </header>
        <PublicBlockRenderer blocks={blocks} />
      </div>
    </article>
  )
}
