import { isComingSoonEnabled } from '@/lib/coming-soon';
import { featureFlags } from '@/lib/feature-flags';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

const matchesRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDisabledClientFeature =
    (!featureFlags.clubs &&
      ['/clubs', '/my-club'].some((route) => matchesRoute(pathname, route))) ||
    (!featureFlags.tournaments && matchesRoute(pathname, '/tournaments'));

  if (isDisabledClientFeature) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isDisabledAdminFeature =
    (!featureFlags.clubs && matchesRoute(pathname, '/admin/kelola-club')) ||
    (!featureFlags.tournaments &&
      ['/admin/kelola-turnamen', '/admin/turnamen'].some((route) =>
        matchesRoute(pathname, route)
      )) ||
    (!featureFlags.adminPushNotifications && matchesRoute(pathname, '/admin/kelola-notifikasi'));

  if (isDisabledAdminFeature) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (!isComingSoonEnabled()) {
    return NextResponse.next();
  }

  if (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)']
};
