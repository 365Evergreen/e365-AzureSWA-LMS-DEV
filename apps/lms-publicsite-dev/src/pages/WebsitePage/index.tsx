import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@lms/shared-ui'
import { apiBase } from '../../api/apiBase'
import { usePage } from '../../hooks/usePage'
import { PublicBlockRenderer } from '../../components/PublicBlockRenderer'
import type { Block } from '../../components/PublicBlockRenderer'
import { CourseLandingPage } from '../../components/CourseLandingPage'
import styles from './WebsitePage.module.css'

interface CourseFallback {
  courseId: string
  title: string
  description: string
  thumbnailUrl?: string
  tags: string[]
}

export default function WebsitePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { metadata, blocks, loading, error } = usePage(slug)
  const [fallbackCourse, setFallbackCourse] = useState<CourseFallback | null>(null)
  const [fallbackLoading, setFallbackLoading] = useState(false)

  useEffect(() => {
    if (loading || metadata || !slug) return

    let cancelled = false
    setFallbackLoading(true)
    setFallbackCourse(null)

    fetch(`${apiBase()}/api/catalogue/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`)
        return res.json() as Promise<CourseFallback>
      })
      .then((course) => {
        if (!cancelled) setFallbackCourse(course)
      })
      .catch(() => {
        if (!cancelled) setFallbackCourse(null)
      })
      .finally(() => {
        if (!cancelled) setFallbackLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug, loading, metadata])

  if (loading || fallbackLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!metadata && fallbackCourse) {
    return (
      <CourseLandingPage
        metadata={{
          title: fallbackCourse.title,
          description: fallbackCourse.description,
          featuredImage: fallbackCourse.thumbnailUrl,
          tags: fallbackCourse.tags,
          linkedCourseId: fallbackCourse.courseId,
        }}
        blocks={[]}
      />
    )
  }

  if (error || !metadata) {
    return <Navigate to="/404" replace />
  }

  const heroIndex = blocks.findIndex((b) => b.type === 'hero')
  const hasHero = heroIndex !== -1
  const heroBlock = hasHero ? blocks[heroIndex] : null
  const otherBlocks = hasHero ? blocks.filter((_, i) => i !== heroIndex) : blocks

  if (metadata.templateId === 'course-landing') {
    return <CourseLandingPage metadata={metadata} blocks={blocks as Block[]} />
  }

  return (
    <article className={styles.page}>
      {heroBlock && <PublicBlockRenderer blocks={[heroBlock as Block]} />}
      <div className={styles.inner}>
        {!hasHero && (
          <header className={styles.header}>
            <h1 className={styles.title}>{metadata.title}</h1>
            {metadata.description && (
              <p className={styles.description}>{metadata.description}</p>
            )}
          </header>
        )}
        {otherBlocks.length > 0 && <PublicBlockRenderer blocks={otherBlocks as Block[]} />}
      </div>
    </article>
  )
}
