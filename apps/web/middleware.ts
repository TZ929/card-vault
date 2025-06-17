// apps/web/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware({
  publicRoutes: [
    '/',           // always public
    '/sign-in*',   // Clerk sign-in widget
    '/sign-up*',   // Clerk sign-up widget
    '/_next/*',    // Next.js internals
    '/favicon.ico' // favicon
  ]
})

export const config = {
  matcher: [
    '/protected/:path*',  // only signed-in users can reach /protected/...
    '/admin/:path*'       // only signed-in users can reach /admin/...
  ]
}
