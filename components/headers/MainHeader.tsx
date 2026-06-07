'use client';

import logo from '@/assets/img/logo.webp';
import { cn } from '@/lib/utils';
import { profileQueryOptions } from '@/queries/profile';
import { notificationsQueryOptions } from '@/queries/notification';
import { IconBellFilled, IconUserCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CartSheet from '../CartSheet';
import LogoutButton from '../buttons/LogoutButton';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { usePathname } from 'next/navigation';
import useAuthModalStore from '@/stores/useAuthModalStore';
import useAuthStore from '@/stores/useAuthStore';
import { useMemo } from 'react';

type Props = {
  onBack?: () => void;
  backHref?: string;
  withLogo?: boolean;
  title?: string;
  withBorder?: boolean;
  withNotificationBadge?: boolean;
  withCartBadge?: boolean;
};

type NavItem = {
  title: string;
  path: string;
  requiresAuth?: boolean;
};

const MainHeader = ({
  onBack,
  backHref,
  withLogo = true,
  title,
  withBorder = false,
  withNotificationBadge,
  withCartBadge
}: Props) => {
  const { isAuth, token } = useAuthStore();
  const hasAuthSession = isAuth || !!token;
  const { data: user, isPending: isUserPending } = useQuery({
    ...profileQueryOptions,
    enabled: hasAuthSession
  });
  const pathname = usePathname();
  const openAuthModal = useAuthModalStore((state) => state.open);

  const isAuthenticated = hasAuthSession && !!user?.id;
  const shouldShowUserSkeleton = hasAuthSession && isUserPending;

  // Fetch notifications only if authenticated and notification badge is shown
  const { data: notifications } = useQuery({
    ...notificationsQueryOptions(),
    enabled: isAuthenticated
  });

  // Check if there are unread notifications
  const hasUnreadNotifications = useMemo(() => {
    if (!notifications) return false;
    return notifications.some((notif) => !notif.isRead);
  }, [notifications]);

  const navItems: NavItem[] = [
    { title: 'Home', path: '/' },
    { title: 'Booking', path: '/booking' },
    { title: 'Club', path: '/clubs' },
    { title: 'Tournaments', path: '/tournaments' },
    { title: 'Membership', path: '/membership' }
  ];

  return (
    <>
      <header
        className={cn('fixed top-0 right-0 left-0 z-40', withBorder && 'border-b', 'bg-white')}
      >
        <div className="mx-auto w-11/12 py-2 lg:max-w-7xl">
          <main className="flex min-h-16 items-center gap-4 lg:min-h-12">
            {(onBack || backHref || title) && (
              <div className="flex items-center gap-6 lg:hidden">
                {onBack && (
                  <Button variant="light" size="icon-sm" onClick={onBack}>
                    <ChevronLeft className="size-6" />
                  </Button>
                )}
                {backHref && (
                  <Link href={backHref}>
                    <Button variant="light" size="icon-sm">
                      <ChevronLeft className="size-6" />
                    </Button>
                  </Link>
                )}
                {title && (
                  <h1 className="text-primary text-lg font-semibold lg:text-xl">{title}</h1>
                )}
              </div>
            )}

            {withLogo && (
              <Link href="/" prefetch className="lg:hidden">
                <div className="relative flex h-16 w-36 items-center justify-center">
                  <Image
                    src={logo}
                    alt="logo"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                </div>
              </Link>
            )}

            <Link href="/" prefetch className="hidden lg:block">
              <div className="relative flex h-16 w-36 items-center justify-center">
                <Image
                  src={logo}
                  alt="logo"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="ml-12 hidden items-center gap-6 lg:flex">
              {navItems.map((item) => {
                const className = cn(
                  'text-sm font-medium text-gray-600 transition-colors hover:text-primary',
                  pathname === item.path && 'text-primary'
                );

                if (item.requiresAuth && !isAuthenticated) {
                  return (
                    <button key={item.path} className={className} onClick={openAuthModal}>
                      {item.title}
                    </button>
                  );
                }

                return (
                  <Link key={item.path} href={item.path} className={className}>
                    {item.title}
                  </Link>
                );
              })}
            </div>

            <div className="ml-auto flex items-center justify-end gap-6">
              {shouldShowUserSkeleton ? (
                <>
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="size-8 rounded-lg" />
                </>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {withNotificationBadge && (
                    <Link href="/notifications">
                      <Button variant="ghost" size="icon-sm">
                        <div className="relative flex items-center justify-center">
                          <IconBellFilled className="text-primary size-7" />
                          {hasUnreadNotifications && (
                            <div className="bg-badge absolute top-1 right-1 size-2 rounded-full" />
                          )}
                        </div>
                      </Button>
                    </Link>
                  )}

                  {!withNotificationBadge && (
                    <Link href="/notifications" className="hidden lg:block">
                      <Button variant="ghost" size="icon-sm">
                        <div className="relative flex items-center justify-center">
                          <IconBellFilled className="text-primary size-7" />
                          {hasUnreadNotifications && (
                            <div className="bg-badge absolute top-1 right-1 size-2 rounded-full" />
                          )}
                        </div>
                      </Button>
                    </Link>
                  )}

                  {withCartBadge ? (
                    <CartSheet />
                  ) : (
                    <div className="hidden lg:block">
                      <CartSheet />
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="hidden lg:inline-flex">
                        <IconUserCircle className="text-primary size-7" />
                        <span className="sr-only">Akun</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/my-club">My Club</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/invoice">Riwayat Booking</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="p-1">
                        <LogoutButton className="w-full" />
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-5">
                  <div className="hidden lg:block">
                    <CartSheet />
                  </div>
                  <Button
                    onClick={openAuthModal}
                    className="bg-primary h-11 px-6 text-white hover:bg-[#cc452c]"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </main>
        </div>
      </header>
    </>
  );
};

export default MainHeader;
