import { useState, useEffect } from 'react'
import { apiBase } from '../api/apiBase'

export interface NavNode {
  slug: string
  label: string
  href: string
  order: number
  children: NavNode[]
}

const NAV_CACHE_KEY = 'public-site-nav'

const DEFAULT_NAV_ITEMS: NavNode[] = [
  { slug: 'home', label: 'Home', href: '/', order: 10, children: [] },
  { slug: 'courses', label: 'Courses', href: '/catalogue', order: 20, children: [] },
  { slug: 'latest-posts', label: 'Latest posts', href: '/blog', order: 30, children: [] },
  { slug: 'knowledge-base', label: 'Knowledge Base', href: '/kb', order: 40, children: [] },
]

function readCachedNav(): NavNode[] | null {
  if (typeof window === 'undefined') {
    return null
  }

  const cached = window.sessionStorage.getItem(NAV_CACHE_KEY)

  if (!cached) {
    return null
  }

  try {
    const parsed = JSON.parse(cached) as NavNode[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export function useNav(): { items: NavNode[]; loading: boolean } {
  const [items, setItems] = useState<NavNode[]>(() => readCachedNav() ?? DEFAULT_NAV_ITEMS)
  const [loading, setLoading] = useState(items.length === 0)

  useEffect(() => {
    fetch(`${apiBase()}/api/nav`)
      .then((r) => (r.ok ? (r.json() as Promise<NavNode[]>) : Promise.resolve([])))
      .then((data) => {
        if (data.length === 0) {
          return
        }

        setItems(data)

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(NAV_CACHE_KEY, JSON.stringify(data))
        }
      })
      .catch(() => setItems((current) => (current.length > 0 ? current : DEFAULT_NAV_ITEMS)))
      .finally(() => setLoading(false))
  }, [])

  return { items, loading }
}
