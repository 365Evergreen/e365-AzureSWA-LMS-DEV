import { useState, useEffect } from 'react'
import { apiBase } from '../api/apiBase'
import type { Block } from '../components/PublicBlockRenderer'

interface PageMetadata {
  pageId: string
  slug: string
  title: string
  description: string
  status: string
  contentType: string
  templateId: string
  bundleUrl: string
  publishedAt: string
  updatedAt: string
  author?: string
  tags?: string[]
  featuredImage?: string
  linkedCourseId?: string
  linkedCourseSlug?: string
  linkedCourseTitle?: string
}

interface PageBundle {
  blocks: Block[]
}

interface UsePageResult {
  metadata: PageMetadata | null
  blocks: Block[]
  loading: boolean
  error: string | null
}

export type ContentType = 'page' | 'post' | 'knowledge'

// ── In-memory TTL cache ───────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  metadata: PageMetadata
  blocks: Block[]
  ts: number
}

const pageCache = new Map<string, CacheEntry>()

function getCached(key: string): CacheEntry | null {
  const entry = pageCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    pageCache.delete(key)
    return null
  }
  return entry
}
// ─────────────────────────────────────────────────────────────────────────────

export function usePage(slug: string, type: ContentType = 'page'): UsePageResult {
  const cacheKey = `${slug}:${type}`
  const cached = getCached(cacheKey)

  const [metadata, setMetadata] = useState<PageMetadata | null>(cached?.metadata ?? null)
  const [blocks, setBlocks] = useState<Block[]>(cached?.blocks ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hit = getCached(cacheKey)
    if (hit) {
      setMetadata(hit.metadata)
      setBlocks(hit.blocks)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setMetadata(null)
    setBlocks([])

    fetch(`${apiBase()}/api/pages/${slug}?type=${type}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`)
        return res.json() as Promise<{ metadata: PageMetadata; bundle: PageBundle }>
      })
      .then(({ metadata, bundle }) => {
        if (cancelled) return
        const resolvedBlocks = bundle.blocks ?? []
        pageCache.set(cacheKey, { metadata, blocks: resolvedBlocks, ts: Date.now() })
        setMetadata(metadata)
        setBlocks(resolvedBlocks)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load page')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [slug, type, cacheKey])

  return { metadata, blocks, loading, error }
}
