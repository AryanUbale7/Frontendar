import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/signin",
  "/signup",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/forbidden",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Maintenance mode bypass check
  const BYPASS_KEY = "dev-mode-arena";
  const BYPASS_COOKIE = "bypass_maintenance";

  const isApiOrAsset = pathname.startsWith("/api") || 
                        pathname.startsWith("/_next") || 
                        pathname.startsWith("/under-construction") ||
                        pathname.includes(".");

  // 1. Check for bypass query parameter
  const bypassParam = request.nextUrl.searchParams.get("bypass");
  if (bypassParam === BYPASS_KEY) {
    const response = NextResponse.redirect(new URL(pathname, request.url));
    // Set bypass cookie for 30 days
    response.cookies.set(BYPASS_COOKIE, "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
    return response;
  }

  // 2. Check if the bypass cookie is set
  const hasBypassCookie = request.cookies.get(BYPASS_COOKIE)?.value === "true";

  // 3. If not bypassed and not a public asset/API, rewrite to under-construction page
  if (!hasBypassCookie && !isApiOrAsset) {
    return NextResponse.rewrite(new URL("/under-construction", request.url));
  }

  // Handle common auth route aliases
  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/sign-up", request.url), 308);
  }
  if (pathname === "/signin" || pathname === "/login") {
    return NextResponse.redirect(new URL("/sign-in", request.url), 308);
  }

  // Check if route is public or static asset
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith("/_next") || pathname.includes(".")
  );

  const authCookie = request.cookies.get("fa_session_active")?.value;
  const isAuthenticated = authCookie === "true" || authCookie === "1";

  // Protect internal routes if unauthenticated
  if (!isPublicRoute && (pathname.startsWith("/dashboard") || pathname.startsWith("/profile"))) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // If already authenticated and navigating to sign-in or sign-up, redirect to dashboard
  if ((pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/signup") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
