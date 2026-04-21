'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '../apiClient';
import type { PathDetail } from '../apiClient';

export function usePathDetail(pathId?: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PathDetail | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pathId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const client = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL });
        const res = await client.getPathDetail(pathId);
        if (mounted) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pathId]);

  return { loading, data, error };
}
