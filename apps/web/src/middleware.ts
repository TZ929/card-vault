import { clerkMiddleware, getAuth }   from '@clerk/nextjs/server';
import { NextResponse }               from 'next/server';

/**
 * RBAC-aware Clerk middleware.
 *
 * - Reads the user’s role from the session token.
 * - Redirects non-admins who try to visit /admin(/**) to /403.
 * - Leaves everything else untouched.
 */
export default clerkMiddleware((req) => {
  // Grab auth info straight from the request
  const { sessionClaims } = getAuth(req);

  // Where we stored the role in the token (after the dashboard tweak)
  const role = sessionClaims?.publicMetadata?.role as string | undefined;

  // Example: protect every route that starts with /admin
  if (req.nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN') {
    // pick your “no-permission” location
    return NextResponse.redirect(new URL('/403', req.url));
  }

  return NextResponse.next();
});

/**
 * Tell Next.js which routes we want the middleware to run on.
 * Here we only care about /admin and its sub-paths.
 */
export const config = {
  matcher: ['/admin/:path*'],
};
