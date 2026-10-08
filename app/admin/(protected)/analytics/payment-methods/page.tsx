'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { revenueDateBoundary } from '@/lib/revenue-date';
import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { paymentMethodsAnalyticsQueryOptions } from '@/queries/admin/analytics';
import PaymentMethodsSection from '@/components/admin/analytics/PaymentMethodsSection';
import type { DateRange } from 'react-day-picker';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

export default function PaymentMethodsPage() {
  const { hasAccess, isLoading: isAccessLoading } = useRoleAccess({
    allowedRoles: [ROLE.ADMIN],
    redirectTo: '/admin/analytics/business-insights'
  });
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const startDate = revenueDateBoundary(range?.from);
  const endDate = revenueDateBoundary(range?.to, true);

  const { data: paymentData, isLoading } = useQuery({
    ...paymentMethodsAnalyticsQueryOptions(startDate, endDate),
    enabled: hasAccess
  });

  if (isAccessLoading || !hasAccess) return null;

  return (
    <main className="space-y-6">
      <AppSectionHeader
        title="Payment Methods Analytics"
        description="Payment method usage and revenue distribution"
      >
        <DateRangeInput value={range} onValueChange={(r) => setRange(r ?? undefined)} />
      </AppSectionHeader>

      <PaymentMethodsSection data={paymentData} isLoading={isLoading} />
    </main>
  );
}
