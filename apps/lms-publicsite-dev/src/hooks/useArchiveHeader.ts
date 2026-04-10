import { useState, useEffect } from 'react'
import { apiBase } from '../api/apiBase'
import type { Block } from '../components/PublicBlockRenderer'

interface UseArchiveHeaderResult {
  blocks: Block[]
  /** True only while the first fetch is in flight — never blocks the listing below */
  loading: boolean
}

/**
 * Silently fetches a CMS-managed archive header page for a given section.
 * The slug convention is:  archive-blog  /  archive-courses
 *
 * Returns an empty blocks array (not an error) when the page doesn't exist yet,
 * so callers can fall back to a hardcoded default heading without any error UI.
 */
export function useArchiveHeader(section: string): UseArchiveHeaderResult {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`${apiBase()}/api/pages/archive-${section}?type=page`)
      .then(async (res) => {
        if (!res.ok) return // 404 → fall back silently
        const data = await res.json() as { bundle?: { blocks?: Block[] } }
        if (!cancelled) setBlocks(data?.bundle?.blocks ?? [])
      })
      .catch(() => { /* fail silently — listing still renders */ })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [section])

  return { blocks, loading }
}
