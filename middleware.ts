import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/invite(.*)', // Allow invite routes to be accessed without auth
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // If user is not authenticated and trying to access protected route, redirect to home
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // Protect routes that require authentication
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

