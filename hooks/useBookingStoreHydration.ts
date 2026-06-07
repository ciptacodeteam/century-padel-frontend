'use client';

import { useBookingStore } from '@/stores/useBookingStore';
import { useEffect, useState } from 'react';

export function useBookingStoreHydration() {
  const [isHydrated, setIsHydrated] = useState(
    () => useBookingStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsub = useBookingStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    setIsHydrated(useBookingStore.persist.hasHydrated());

    return unsub;
  }, []);

  return isHydrated;
}
