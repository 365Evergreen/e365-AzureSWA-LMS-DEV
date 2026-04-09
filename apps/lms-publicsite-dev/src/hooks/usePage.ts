import { useState, useEffect } from 'react'
import { apiBase } from '../api/apiBase'

interface Block {
  id: string
  type: string
  version: number
  payload: Record<string, unknown>
}

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

export function usePage(slug: string): UsePageResult {
  const [metadata, setMetadata] = useState<PageMetadata | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${apiBase()}/api/pages/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`)
        return res.json() as Promise<{ metadata: PageMetadata; bundle: PageBundle }>
      })
      .then(({ metadata, bundle }) => {
        if (cancelled) return
        setMetadata(metadata)
        setBlocks(bundle.blocks ?? [])
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load page')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [slug])

  return { metadata, blocks, loading, error }
}
