import { useState, useEffect, useCallback } from 'react'
import type { CourseMetadata } from '@lms/shared-schemas'
import { apiBase } from '../api/apiBase'

interface UseCatalogueOptions {
  audience?: string
  level?: string
  tag?: string
}

interface UseCatalogueReturn {
  courses: CourseMetadata[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCatalogue(options: UseCatalogueOptions = {}): UseCatalogueReturn {
  const [courses, setCourses] = useState<CourseMetadata[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { audience, level, tag } = options

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('type', 'PATH')
      const qs = params.toString()
      const res = await fetch(`${apiBase()}/api/catalogue-index${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json() as {
        items: Array<{
          itemId: string
          slug: string
          title: string
          summary: string
          difficulty?: 'Foundation' | 'Beginner' | 'Intermediate' | 'Advanced'
          role?: string
          tagsCsv: string
          thumbnailUrl?: string
          estimatedMinutes: number
          updatedOn: string
          createdOn: string
        }>
        total: number
      }

      const detailed = await Promise.all(
        data.items.map(async (item) => {
          let moduleCount = 0
          try {
            const detailRes = await fetch(`${apiBase()}/api/catalogue/paths/${item.itemId}`)
            if (detailRes.ok) {
              const detail = await detailRes.json() as { modules?: unknown[] }
              moduleCount = Array.isArray(detail.modules) ? detail.modules.length : 0
            }
          } catch {
            moduleCount = 0
          }

          const tags = item.tagsCsv
            ? item.tagsCsv.split(',').map((value) => value.trim()).filter(Boolean)
            : []

          const mappedLevel: CourseMetadata['level'] =
            item.difficulty === 'Advanced'
              ? 'advanced'
              : item.difficulty === 'Intermediate'
                ? 'intermediate'
                : 'beginner'

          return {
            courseId: item.itemId,
            slug: item.slug,
            title: item.title,
            description: item.summary ?? '',
            status: 'published',
            audience: audience && audience !== ''
              ? (audience as CourseMetadata['audience'])
              : 'all',
            level: mappedLevel,
            tags,
            thumbnailUrl: item.thumbnailUrl,
            bundleUrl: `${apiBase()}/api/catalogue/paths/${item.itemId}`,
            authorId: '',
            publishedAt: item.updatedOn || item.createdOn || new Date().toISOString(),
            updatedAt: item.updatedOn || item.createdOn || new Date().toISOString(),
            moduleCount,
            durationMinutes: item.estimatedMinutes ?? 0,
          } satisfies CourseMetadata
        }),
      )

      const filtered = detailed.filter((course) => {
        if (level && course.level !== level) return false
        if (tag && !course.tags.includes(tag)) return false
        return true
      })

      setCourses(filtered)
      setTotal(filtered.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalogue')
    } finally {
      setLoading(false)
    }
  }, [audience, level, tag])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return { courses, total, loading, error, refetch: fetchCourses }
}
