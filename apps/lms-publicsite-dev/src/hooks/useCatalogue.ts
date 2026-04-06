import { useState, useEffect, useCallback } from 'react'
import type { CourseMetadata } from '@lms/shared-schemas'

interface CatalogueResult {
  courses: CourseMetadata[]
  total: number
}

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
      const base = import.meta.env.VITE_API_BASE_URL ?? ''
      const params = new URLSearchParams()
      if (audience) params.set('audience', audience)
      if (level) params.set('level', level)
      if (tag) params.set('tag', tag)
      const qs = params.toString()
      const res = await fetch(`${base}/api/catalogue${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: CatalogueResult = await res.json()
      setCourses(data.courses)
      setTotal(data.total)
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
