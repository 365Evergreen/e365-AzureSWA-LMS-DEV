'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '../apiClient';
import { useAuth } from '@lms/shared-auth';
import { msalInstance } from '../msalConfig';

export function useCourse(id: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const auth = useAuth(msalInstance) as any;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const getToken = auth?.getAccessToken ? async () => await auth.getAccessToken() : undefined;
        const client = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL, getToken });
        const res = await client.getCourse(id);
        if (mounted) setData(res);
      } catch (err: any) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return { loading, data, error };
}
