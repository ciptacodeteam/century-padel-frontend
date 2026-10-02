'use client';

import logo from '@/assets/img/logo.webp';
import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/clipboard-copy';
import { invoiceQueryOptions } from '@/queries/invoice';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { ArrowLeft, CheckCircle2, Clock3, FileText } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
// Local typed view-models for the invoice detail API response
type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

type ApiPaymentMethod = {
  id: string;
  name: string;
  logo?: string | null;
  channel?: string | null;
  fees?: number;
  percentage?: string;
};

type ApiPaymentMeta = {
  status?: string;
  updated?: string;
  captures?: Array<{
    capture_id: string;
    capture_amount: number;
    capture_timestamp: string;
  }>;
  currency?: string;
  metadata?: Record<string, any>;
  payment_id?: string;
  channel_code?: string;
  reference_id?: string;
  request_amount?: number;
  payment_details?: Record<string, any>;
  payment_request_id?: string;
  // Optional fields observed in some channels
  channel_properties?: Record<string, any>;
  actions?: Array<{
    descriptor?: string;
    type?: string;
    value?: string;
    url?: string;
    display_name?: string;
    expiry?: string;
  }>;
};

type ApiPayment = {
  id: string;
  status: string;
  amount: number;
  fees: number;
  externalRef?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  meta?: ApiPaymentMeta;
  method?: ApiPaymentMethod;
};

type ApiBookingDetail = {
  id: string;
  price: number;
  discountPrice?: number | null;
  slot?: {
    id: string;
    type: 'COURT' | 'COACH' | 'BALLBOY' | string;
    courtId?: string | null;
    staffId?: string | null;
    startAt?: string;
    endAt?: string;
    price?: number;
    discountPrice?: number | null;
    isAvailable?: boolean;
    createdAt?: string;
    updatedAt?: string;
    court?: { id: string; name: string };
    staff?: { id: string; name: string };
  };
  court?: { id: string; name: string } | null;
};

type ApiBooking = {
  id: string;
  status: 'HOLD' | 'CONFIRMED' | 'CANCELLED' | string;
  totalPrice: number;
  processingFee: number;
  courtNormalPrice?: number;
  courtDiscountPrice?: number;
  createdAt: string;
  details?: ApiBookingDetail[];
  inventories?: Array<{
    id: string;
    inventory?: { id: string; name: string };
    quantity: number;
    price: number;
  }>;
  coaches?: Array<{
    id: string;
    price: number;
    slot?: { startAt?: string; staff?: { name?: string } };
    bookingCoachType?: { name?: string };
  }>;
  ballboys?: Array<{
    id: string;
    price: number;
    slot?: { startAt?: string; staff?: { name?: string } };
  }>;
};

type ApiMembership = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  sessions: number;
  duration: number;
  benefits?: Array<{ id: string; benefit: string }>;
};

type ApiMembershipUser = {
  id: string;
  membershipId: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  remainingSessions: number;
  remainingDuration: number;
  isExpired: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  suspensionEndDate: string | null;
  membership?: ApiMembership;
};

type InvoiceDetail = {
  id: string;
  number: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | string;
  subtotal: number;
  processingFee: number;
  promoDiscountAmount?: number;
  total: number;
  issuedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  user?: ApiUser;
  booking?: ApiBooking | null;
  classBooking?: any | null;
  membershipUser?: ApiMembershipUser | null;
  payment?: ApiPayment | null;
  paymentMeta?: ApiPaymentMeta | null;
  paymentInstructions?: any | null;
  paymentUrl?: string | null;
};

type InvoiceDetailApiResponse = {
  success: boolean;
  msg: string;
  code: number;
  data: InvoiceDetail;
};

import AddOnsCard from '@/components/invoice/AddOnsCard';
import BookingDetailsCard from '@/components/invoice/BookingDetailsCard';
import MembershipDetailsCard from '@/components/invoice/MembershipDetailsCard';
import PaymentActionCard from '@/components/invoice/PaymentActionCard';
import PaymentSummaryCard from '@/components/invoice/PaymentSummaryCard';
import { getStatusColor, getStatusLabel } from '@/components/invoice/status';
import InvoiceShareButton from '@/components/invoice/InvoiceShareButton';

dayjs.locale('id');

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceNumber = params.invoiceNumber as string;

  const {
    data: response,
    isPending,
    isError,
    isLoading,
    refetch
  } = useQuery({
    ...invoiceQueryOptions(invoiceNumber),
    // Poll every 3 seconds when status is PENDING or HOLD
    refetchInterval: (query) => {
      const typedData = query.state.data as InvoiceDetailApiResponse | undefined;
      const status = typedData?.data?.status;
      // Stop polling if payment is completed (PAID, FAILED, EXPIRED, CANCELLED)
      if (['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(status || '')) {
        return false;
      }
      // Poll every 3 seconds for pending payments
      return 3000;
    },
    refetchIntervalInBackground: true // Continue polling even when tab is not focused
  });

  const handleExpired = () => {
    // Refetch invoice data when countdown expires
    refetch();
  };

  const typedResponse = response as InvoiceDetailApiResponse | undefined;
  const invoice = typedResponse?.data;
  const booking = invoice?.booking ?? undefined;
  const membershipUser = invoice?.membershipUser ?? undefined;

  // Show loading state while fetching initial data
  if (isLoading || (isPending && !response)) {
    return (
      <div className="min-h-screen">
        <MainHeader
          title="Detail Transaksi"
          withLogo={false}
          backHref="/invoice"
          withMobileBorder
        />
        <div className="container mx-auto mt-28 pb-10">
          <div className="mx-auto w-11/12 max-w-7xl">
            <div className="animate-pulse space-y-4">
              {/* Payment Action Card Skeleton */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="mx-auto h-6 w-32 rounded bg-gray-200"></div>
                    <div className="mx-auto h-10 w-48 rounded bg-gray-200"></div>
                    <div className="mx-auto h-32 w-32 rounded-lg bg-gray-200"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Info Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-5 w-32 rounded bg-gray-200"></div>
                    <div className="h-4 w-48 rounded bg-gray-200"></div>
                    <div className="h-4 w-40 rounded bg-gray-200"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-5 w-40 rounded bg-gray-200"></div>
                    <div className="h-4 w-56 rounded bg-gray-200"></div>
                    <div className="h-4 w-44 rounded bg-gray-200"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-5 w-36 rounded bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-20 w-full rounded bg-gray-200"></div>
                      <div className="h-20 w-full rounded bg-gray-200"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-gray-200"></div>
                      <div className="h-4 w-32 rounded bg-gray-200"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-28 rounded bg-gray-200"></div>
                      <div className="h-4 w-28 rounded bg-gray-200"></div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <div className="h-6 w-20 rounded bg-gray-200"></div>
                        <div className="h-6 w-36 rounded bg-gray-200"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen">
        <MainHeader
          title="Detail Transaksi"
          withLogo={false}
          backHref="/invoice"
          withMobileBorder
        />
        <div className="container mx-auto mt-28 px-4 pb-24 lg:mt-28">
          <div className="mx-auto max-w-4xl text-center">
            <Card>
              <CardContent className="pt-6">
                <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h2 className="mb-2 text-2xl font-bold">Invoice Tidak Ditemukan</h2>
                <p className="mb-6 text-gray-600">
                  Invoice dengan nomor {invoiceNumber} tidak ditemukan.
                </p>
                <Button onClick={() => router.push('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const bookingDetails = booking?.details || [];
  const bookingInventories = booking?.inventories || [];
  const bookingCoaches = booking?.coaches || [];
  const bookingBallboys = booking?.ballboys || [];
  const subtotalForDisplay = invoice.subtotal + (invoice.promoDiscountAmount || 0);
  const canPay =
    ['PENDING', 'HOLD'].includes(invoice.status) &&
    (!invoice.dueDate || dayjs().isBefore(dayjs(invoice.dueDate)));
  const isPaid = invoice.status === 'PAID';
  const transactionDate = invoice.paidAt || invoice.dueDate || invoice.issuedAt;
  const transactionDateLabel = invoice.paidAt
    ? 'Dibayar pada'
    : invoice.dueDate
      ? 'Batas bayar'
      : 'Diterbitkan pada';

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <MainHeader title="Detail Transaksi" withLogo={false} backHref="/invoice" withMobileBorder />

      <div
        className="bg-primary absolute top-20 right-0 left-0 h-64 bg-linear-to-br from-[#e35336] to-[#c93f28] lg:top-20 lg:h-80"
        aria-hidden="true"
      />

      <main className="relative mx-auto w-full max-w-3xl px-4 pt-24 pb-14 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32 lg:pb-20">
        <div className="mb-7 hidden text-center text-white lg:block">
          <p className="text-sm font-semibold tracking-[0.2em] text-white/75 uppercase">
            Century Padel
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Invoice Transaksi</h1>
        </div>

        <article className="relative overflow-visible rounded-t-2xl bg-white shadow-[0_18px_50px_rgba(51,32,26,0.16)]">
          <header className="px-5 pt-8 pb-6 text-center sm:px-8 sm:pt-10 sm:pb-8">
            <Image
              src={logo}
              alt="Century Padel"
              priority
              className="mx-auto h-auto w-48 sm:w-56"
            />
            <p className="text-primary mt-4 text-xs font-bold tracking-[0.22em] uppercase">
              Invoice Digital
            </p>
          </header>

          <section className="border-y border-dashed border-gray-200 px-5 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex size-8 items-center justify-center rounded-full ${
                    isPaid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {isPaid ? <CheckCircle2 className="size-5" /> : <Clock3 className="size-5" />}
                </span>
                <div>
                  <p className="text-xs text-gray-500">Status transaksi</p>
                  <p className="font-semibold text-gray-950">
                    {isPaid ? 'Transaksi berhasil' : getStatusLabel(invoice.status)}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(invoice.status)} variant="outline">
                {getStatusLabel(invoice.status)}
              </Badge>
            </div>

            <div className="bg-primary/10 mt-6 rounded-xl px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
                <p className="text-sm font-medium text-gray-600">Total Bayar</p>
                <p className="text-primary text-2xl font-bold tracking-tight sm:text-3xl">
                  {formatCurrency(invoice.total)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-4 text-base font-bold text-gray-950">Detail Transaksi</h2>
              <dl className="space-y-4 text-sm">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <dt className="text-gray-500">Nomor invoice</dt>
                  <dd className="flex min-w-0 items-center justify-end gap-1 font-semibold text-gray-950">
                    <span className="max-w-52 truncate sm:max-w-none">{invoice.number}</span>
                    <CopyButton
                      variant="ghost"
                      size="sm"
                      content={invoice.number}
                      aria-label="Salin nomor invoice"
                    />
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                  <dt className="text-gray-500">Pelanggan</dt>
                  <dd className="max-w-52 text-right font-semibold break-words text-gray-950 sm:max-w-sm">
                    {invoice.user?.name || '-'}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                  <dt className="text-gray-500">Nomor telepon</dt>
                  <dd className="text-right font-medium text-gray-700">
                    {invoice.user?.phone || '-'}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                  <dt className="text-gray-500">{transactionDateLabel}</dt>
                  <dd className="text-right font-medium text-gray-700">
                    {dayjs(transactionDate).format('DD MMM YYYY, HH:mm')}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {membershipUser && (
            <MembershipDetailsCard membershipUser={membershipUser as unknown as any} receipt />
          )}

          {booking && bookingDetails.length > 0 && (
            <BookingDetailsCard details={bookingDetails} receipt />
          )}

          {booking && (
            <AddOnsCard
              coaches={bookingCoaches as any}
              ballboys={bookingBallboys as any}
              inventories={bookingInventories as any}
              receipt
            />
          )}

          <PaymentSummaryCard
            subtotal={subtotalForDisplay}
            processingFee={invoice.processingFee}
            promoDiscountAmount={invoice.promoDiscountAmount}
            total={invoice.total}
            method={
              invoice.payment?.method
                ? {
                    name: invoice.payment.method.name,
                    logo: invoice.payment.method.logo || undefined,
                    channel: invoice.payment.method.channel || undefined
                  }
                : undefined
            }
            receipt
          />

          <div className="invoice-receipt-edge" aria-hidden="true" />
        </article>

        <InvoiceShareButton
          invoiceNumber={invoice.number}
          total={invoice.total}
          size="lg"
          className="mt-7 w-full bg-white shadow-sm"
        />

        {canPay && (
          <div className="mt-8">
            <PaymentActionCard
              invoice={invoice as any}
              canPay={canPay}
              onChooseMethod={() => refetch()}
              onExpired={handleExpired}
              onPaid={() => refetch()}
            />
          </div>
        )}
      </main>
    </div>
  );
}
