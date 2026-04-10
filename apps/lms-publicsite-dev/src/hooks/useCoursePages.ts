import { useState, useEffect, useCallback } from 'react'
import { apiBase } from '../api/apiBase'

export interface CoursePage {
  pageId: string
  slug: string
  title: string
  description: string
  status: string
  templateId: string
  tags: string[]
  publishedAt: string
}

interface UseCoursePageResult {
  pages: CoursePage[]
  allTags: string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches all published pages with templateId === 'course-overview'.
 * Public endpoint — no auth required.
 */
export function useCoursePages(): UseCoursePageResult {
  const [pages, setPages] = useState<CoursePage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase()}/api/pages?type=page`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json() as { pages: CoursePage[] }
      const coursePages = data.pages.filter((p) => p.templateId === 'course-overview' && p.status === 'published')
      setPages(coursePages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPages() }, [fetchPages])

  const allTags = Array.from(new Set(pages.flatMap((p) => p.tags))).sort()

  return { pages, allTags, loading, error, refetch: fetchPages }
}
