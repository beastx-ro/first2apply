import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const allowIndex = request.headers.get('x-f2a-allowindex') === 'yes';

  // Check if the referrer contains "vercel"
  if (!allowIndex) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  }

  return NextResponse.next();
}

// Apply middleware to all routes
export const config = {
  matcher: '/:path*',
};
