'use client';

import { useEffect } from 'react';
import { registerBlocks } from '../../lib/registerBlocks';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerBlocks();
  }, []);

  return <>{children}</>;
}
