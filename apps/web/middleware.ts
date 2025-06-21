// apps/web/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',                // Home page
  '/sign-in(.*)',     // Sign-in and related routes
  '/sign-up(.*)',     // Sign-up and related routes
  '/api/scard(.*)',   // Public API for card search
  '/_next/(.*)',      // Next.js internals
  '/favicon.ico',     // Favicon
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect() // Protect all routes that are not public
  }
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
