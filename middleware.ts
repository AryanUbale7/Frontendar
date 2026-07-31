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

  // Check if route is public or static asset
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith("/_next") || pathname.includes(".")
  );

  const authCookie = request.cookies.get("fa_session_active")?.value;
  const isAuthenticated = authCookie === "true" || authCookie === "1";

  // Protect internal routes if unauthenticated
  if (!isPublicRoute && (pathname.startsWith("/dashboard") || pathname.startsWith("/register") || pathname.startsWith("/profile"))) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // If already authenticated and navigating to sign-in or sign-up, redirect to dashboard
  if ((pathname === "/sign-in" || pathname === "/sign-up") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
