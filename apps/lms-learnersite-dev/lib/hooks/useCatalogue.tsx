'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '../apiClient';
import type { LearnerCourse } from '../apiClient';
import { useAuth } from '@lms/shared-auth';
import { msalInstance } from '../msalConfig';

const API_SCOPE = process.env.NEXT_PUBLIC_API_SCOPE ?? '';

export function useCatalogue() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LearnerCourse[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { getAccessToken } = useAuth(msalInstance);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const getToken = API_SCOPE ? () => getAccessToken([API_SCOPE]) : undefined;
        const client = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL, getToken });
        const res = await client.getCatalogue();
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
  }, [getAccessToken]);

  return { loading, data, error };
}
