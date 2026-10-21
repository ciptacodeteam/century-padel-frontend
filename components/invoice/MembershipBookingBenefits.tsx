import { Badge } from '@/components/ui/badge';
import {
  getMembershipBookingBenefits,
  type MembershipBenefitDetail
} from '@/lib/membership-booking-benefit';
import { Crown } from 'lucide-react';

const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })
    .format(value)
    .replace(/\s/g, '');

export default function MembershipBookingBenefits({
  details
}: {
  details: MembershipBenefitDetail[];
}) {
  const benefits = getMembershipBookingBenefits(details);
  if (!benefits.length) return null;

  return (
    <section
      className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5"
      aria-label="Manfaat membership"
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-950">
        <Crown className="size-5 text-amber-600" /> Tarif Membership
      </h2>
      <div className="space-y-4">
        {benefits.map((benefit) => (
          <div key={benefit.id} className="rounded-xl border border-amber-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-950">{benefit.name}</p>
              {benefit.type && (
                <Badge variant="outline" className="border-amber-200 text-amber-800">
                  {(
                    {
                      HAPPY_HOUR: 'Happy Hour',
                      PEAK_HOUR: 'Peak Hour',
                      ALL_HOUR: 'All Hour'
                    } as Record<string, string>
                  )[benefit.type] || benefit.type}
                </Badge>
              )}
            </div>
            {benefit.hourlyRate !== null && (
              <p className="text-primary text-xl font-bold">
                {rupiah(benefit.hourlyRate)}
                <span className="text-sm font-normal text-gray-600">/jam</span>
              </p>
            )}
            <p className="mt-1 text-sm text-gray-600">
              Terpakai {benefit.hours} jam dari saldo membership
            </p>
            {benefit.complimentaryHours > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                Termasuk {benefit.complimentaryHours} jam complimentary (Rp0)
              </p>
            )}
            {benefit.usageValue !== null && (
              <dl className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Harga reguler</dt>
                  <dd className="font-medium">{rupiah(benefit.regularPrice)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Nilai pemakaian membership</dt>
                  <dd className="font-medium">{rupiah(benefit.usageValue)}</dd>
                </div>
                {benefit.savings !== null && benefit.savings > 0 && (
                  <div className="flex justify-between gap-4 font-semibold text-green-700">
                    <dt>Estimasi hemat</dt>
                    <dd>{rupiah(benefit.savings)}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        Tarif efektif merupakan estimasi nilai paket dibagi total jam paket. Nilai pemakaian sudah
        termasuk dalam paket membership.
      </p>
    </section>
  );
}
