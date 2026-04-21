import { useState, useEffect, useCallback, useRef } from 'react'
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

// ── In-memory TTL cache ───────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CatalogueCache {
  courses: CourseMetadata[]
  ts: number
}

const catalogueCache = new Map<string, CatalogueCache>()

function getCachedCatalogue(key: string): CatalogueCache | null {
  const entry = catalogueCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    catalogueCache.delete(key)
    return null
  }
  return entry
}
// ─────────────────────────────────────────────────────────────────────────────

type IndexItem = {
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
}

function mapItem(item: IndexItem, audience: string | undefined): CourseMetadata {
  const tags = item.tagsCsv
    ? item.tagsCsv.split(',').map((v) => v.trim()).filter(Boolean)
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
    moduleCount: 0,
    durationMinutes: item.estimatedMinutes ?? 0,
  }
}

export function useCatalogue(options: UseCatalogueOptions = {}): UseCatalogueReturn {
  const { audience, level, tag } = options
  const cacheKey = JSON.stringify({ audience, level, tag })
  const cached = getCachedCatalogue(cacheKey)

  const [courses, setCourses] = useState<CourseMetadata[]>(cached?.courses ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const forceRefetch = useRef(false)

  const fetchCourses = useCallback(async (bustCache = false) => {
    if (!bustCache) {
      const hit = getCachedCatalogue(cacheKey)
      if (hit) {
        setCourses(hit.courses)
        setLoading(false)
        setError(null)
        return
      }
    } else {
      catalogueCache.delete(cacheKey)
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${apiBase()}/api/catalogue-index?type=PATH`)
      if (!res.ok) throw new Error(`API error ${res.status}`)

      const data = await res.json() as { items: IndexItem[]; total: number }

      // ── Phase 1: render immediately from index data ──────────────────────
      const initialCourses = data.items
        .map((item) => mapItem(item, audience))
        .filter((course) => {
          if (level && course.level !== level) return false
          if (tag && !course.tags.includes(tag)) return false
          return true
        })

      catalogueCache.set(cacheKey, { courses: initialCourses, ts: Date.now() })
      setCourses(initialCourses)
      setLoading(false)

      // ── Phase 2: enrich with module counts in the background ─────────────
      const enriched = await Promise.all(
        initialCourses.map(async (course) => {
          try {
            const detailRes = await fetch(`${apiBase()}/api/catalogue/paths/${course.courseId}`)
            if (!detailRes.ok) return course
            const detail = await detailRes.json() as { modules?: unknown[] }
            const moduleCount = Array.isArray(detail.modules) ? detail.modules.length : 0
            return moduleCount === course.moduleCount ? course : { ...course, moduleCount }
          } catch {
            return course
          }
        }),
      )

      const anyChanged = enriched.some((c, i) => c.moduleCount !== initialCourses[i]?.moduleCount)
      if (anyChanged) {
        catalogueCache.set(cacheKey, { courses: enriched, ts: Date.now() })
        setCourses(enriched)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalogue')
      setLoading(false)
    }
  }, [cacheKey, audience, level, tag])

  useEffect(() => {
    fetchCourses(forceRefetch.current)
    forceRefetch.current = false
  }, [fetchCourses])

  const refetch = useCallback(() => {
    forceRefetch.current = true
    fetchCourses(true)
  }, [fetchCourses])

  return { courses, total: courses.length, loading, error, refetch }
}
