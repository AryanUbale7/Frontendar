import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/forbidden",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith("/_next") || pathname.includes(".")
  );

  // Check mock session cookie or header
  const authCookie = request.cookies.get("fa_session_active")?.value;

  // Protect internal routes if unauthenticated
  // User must have cookie set to "true" to access dashboard
  if (!isPublicRoute && pathname.startsWith("/dashboard") && authCookie !== "true") {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Also protect /register and /profile routes
  if ((pathname.startsWith("/register") || pathname.startsWith("/profile")) && authCookie !== "true") {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
