import { useState, useEffect, useCallback } from 'react'
import { apiBase } from '../api/apiBase'

export interface BlogPost {
  pageId: string
  slug: string
  title: string
  description: string
  status: string
  tags: string[]
  publishedAt: string
}

interface UseBlogPostsResult {
  posts: BlogPost[]
  allTags: string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches all published blog posts (contentType === 'post') from the public pages API.
 */
export function useBlogPosts(): UseBlogPostsResult {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase()}/api/pages?type=post`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json() as { pages: BlogPost[] }
      const published = data.pages.filter((p) => p.status === 'published')
      // Newest first
      published.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      setPosts(published)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort()

  return { posts, allTags, loading, error, refetch: fetchPosts }
}
