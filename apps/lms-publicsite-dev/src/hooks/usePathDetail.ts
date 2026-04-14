import { useEffect, useState } from 'react'
import { apiBase } from '../api/apiBase'

export interface PathModule {
  itemId: string
  title: string
  summary: string
  estimatedMinutes: number
  sortOrder: number
  units: Array<{ itemId: string }>
}

export interface PathDetail {
  itemId: string
  title: string
  summary: string
  difficulty?: 'Foundation' | 'Beginner' | 'Intermediate' | 'Advanced'
  role?: string
  learningPath?: string
  estimatedMinutes: number
  tagsCsv: string
  thumbnailUrl?: string
  modules: PathModule[]
}

interface UsePathDetailResult {
  data: PathDetail | null
  loading: boolean
  error: string | null
}

export function usePathDetail(pathId?: string): UsePathDetailResult {
  const [data, setData] = useState<PathDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pathId) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${apiBase()}/api/catalogue/paths/${pathId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`)
        return res.json() as Promise<PathDetail>
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load course')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [pathId])

  return { data, loading, error }
}
