import { isComingSoonEnabled } from '@/lib/coming-soon';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  if (!isComingSoonEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

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
