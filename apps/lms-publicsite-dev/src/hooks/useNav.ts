import { useState, useEffect } from 'react'
import { apiBase } from '../api/apiBase'

export interface NavNode {
  slug: string
  label: string
  href: string
  order: number
  children: NavNode[]
}

export function useNav(): { items: NavNode[]; loading: boolean } {
  const [items, setItems] = useState<NavNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase()}/api/nav`)
      .then((r) => (r.ok ? (r.json() as Promise<NavNode[]>) : Promise.resolve([])))
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return { items, loading }
}
