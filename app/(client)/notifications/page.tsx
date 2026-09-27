'use client';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BellIcon, CheckIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsQueryOptions } from '@/queries/notification';
import { markNotificationReadMutationOptions } from '@/mutations/notification';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

type BookingCancellationData = {
  event: 'BOOKING_CANCELLED';
  invoiceNumber?: string | null;
  reason?: string;
  restoredMembershipHours?: number;
  courtSlots?: Array<{
    courtName: string;
    startAt: string;
    endAt: string;
  }>;
};

export default function NotificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuth) {
      toast.error('Silakan login untuk melihat notifikasi');
      router.push('/');
    }
  }, [isHydrated, isAuth, router]);

  const {
    data: notifications,
    isLoading,
    isError
  } = useQuery({
    ...notificationsQueryOptions(),
    enabled: isAuth && isHydrated
  });

  const { mutate: markAsRead, isPending } = useMutation(
    markNotificationReadMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    })
  );

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleNotificationOpen = (
    notificationId: string,
    isRead: boolean,
    data: BookingCancellationData
  ) => {
    if (!isRead) markAsRead(notificationId);
    if (data.invoiceNumber) router.push(`/invoice/${data.invoiceNumber}`);
  };

  if (!isHydrated || !isAuth) {
    return null;
  }

  return (
    <>
      <MainHeader backHref="/" title={'Notifikasi'} withLogo={false} withBorder />

      <main>
        <section className="mx-auto mt-28 w-11/12 max-w-7xl pb-20">
          {isLoading && (
            <div className="text-muted-foreground flex min-h-[50vh] flex-col items-center justify-center py-16">
              <div className="text-sm">Memuat notifikasi...</div>
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive flex min-h-[50vh] flex-col items-center justify-center py-16">
              <div className="text-sm">Gagal memuat notifikasi. Silakan coba lagi.</div>
            </div>
          )}

          {!isLoading && !isError && (!notifications || notifications.length === 0) && (
            <div className="text-muted-foreground flex min-h-[50vh] flex-col items-center justify-center py-16">
              <BellIcon className="mb-2 h-10 w-10 opacity-40" />
              <div className="text-lg font-semibold">Tidak ada notifikasi</div>
              <div className="text-sm">Anda sudah menyelesaikan semua notifikasi!</div>
            </div>
          )}

          {!isLoading && !isError && notifications && notifications.length > 0 && (
            <ul className="flex flex-col gap-4">
              {notifications.map((notif) => {
                const cancellationData =
                  notif.data?.event === 'BOOKING_CANCELLED'
                    ? (notif.data as BookingCancellationData)
                    : null;

                return (
                  <li
                    key={notif.id}
                    className={cn(
                      'flex gap-3 rounded-lg border bg-white px-4 py-3 transition-all',
                      notif.isRead ? 'opacity-70' : 'border-primary/60',
                      cancellationData?.invoiceNumber && 'hover:bg-muted/40 cursor-pointer'
                    )}
                    onClick={() => {
                      if (cancellationData) {
                        handleNotificationOpen(notif.id, notif.isRead, cancellationData);
                      }
                    }}
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="line-clamp-1 text-base font-semibold">{notif.title}</span>
                        {!notif.isRead && (
                          <div className="bg-primary size-2 rounded-full text-white"></div>
                        )}
                      </div>
                      {notif.message && (
                        <span
                          className={cn(
                            'text-muted-foreground text-sm',
                            !cancellationData && 'line-clamp-2'
                          )}
                        >
                          {notif.message}
                        </span>
                      )}
                      {cancellationData && (
                        <div className="bg-muted/50 mt-2 space-y-2 rounded-md p-3 text-xs">
                          {cancellationData.invoiceNumber && (
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Invoice</span>
                              <span className="font-medium">{cancellationData.invoiceNumber}</span>
                            </div>
                          )}
                          {cancellationData.courtSlots?.map((slot, index) => (
                            <div
                              key={`${slot.startAt}-${index}`}
                              className="flex items-start justify-between gap-3"
                            >
                              <span className="font-medium">{slot.courtName}</span>
                              <span className="text-muted-foreground text-right">
                                {dayjs.utc(slot.startAt).format('DD MMM YYYY')} ·{' '}
                                {dayjs.utc(slot.startAt).format('HH:mm')}–
                                {dayjs.utc(slot.endAt).format('HH:mm')}
                              </span>
                            </div>
                          ))}
                          {cancellationData.reason && (
                            <div className="border-t pt-2">
                              <span className="text-muted-foreground">Alasan: </span>
                              <span>{cancellationData.reason}</span>
                            </div>
                          )}
                          {!!cancellationData.restoredMembershipHours && (
                            <p className="font-medium text-green-700">
                              {cancellationData.restoredMembershipHours} jam membership telah
                              dikembalikan.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-[70px] flex-col items-end justify-between">
                      <span className="text-muted-foreground text-xs">
                        {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                      {!notif.isRead && (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-primary mt-2"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          disabled={isPending}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
