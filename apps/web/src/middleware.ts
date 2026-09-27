import { NextResponse, type NextRequest } from 'next/server';
export function middleware(req: NextRequest) {
  if (req.cookies.get('pm_token')) return NextResponse.next();
  const url = new URL('/login', req.url);
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
export const config = { matcher: ['/create/:path*', '/posters/:path*', '/history', '/admin/:path*', '/billing/:path*'] };
