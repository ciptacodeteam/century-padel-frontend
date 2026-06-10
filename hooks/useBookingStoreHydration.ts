'use client';

import { useBookingStore } from '@/stores/useBookingStore';
import { useEffect, useState } from 'react';

export function useBookingStoreHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const persist = useBookingStore.persist;
    if (!persist) {
      setIsHydrated(true);
      return;
    }

    const unsub = persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    setIsHydrated(persist.hasHydrated());

    return unsub;
  }, []);

  return isHydrated;
}
