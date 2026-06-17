'use client';

import { useBookingStore } from '@/stores/useBookingStore';
import { useEffect, useState } from 'react';

const hasHydrated = () => useBookingStore.persist?.hasHydrated?.() ?? false;

export function useBookingStoreHydration() {
  const [isHydrated, setIsHydrated] = useState(() => hasHydrated());

  useEffect(() => {
    const unsub = useBookingStore.persist?.onFinishHydration?.(() => {
      setIsHydrated(true);
    });

    setIsHydrated(hasHydrated());

    return unsub ?? undefined;
  }, []);

  return isHydrated;
}
