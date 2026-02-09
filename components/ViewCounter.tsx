'use client';

import { useEffect } from 'react';
import { incrementViewCount } from '@/lib/storage';

interface ViewCounterProps {
  dealId: string;
}

export default function ViewCounter({ dealId }: ViewCounterProps) {
  useEffect(() => {
    incrementViewCount(dealId);
  }, [dealId]);

  return null;
}

