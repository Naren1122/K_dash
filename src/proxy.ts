import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Read session token from standard Auth.js / NextAuth cookies
  const sessionToken =
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  const isAuthPage = pathname.startsWith("/login");
  const isProtectedPage =
    pathname.startsWith("/board") ||
    pathname.startsWith("/admin");
  const isSignedOut = searchParams.get("message") === "signed_out";

  // 1. If accessing protected routes without an active session token, redirect to login
  if (isProtectedPage && !sessionToken) {
    const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
    const loginUrl = new URL(`/login?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in and visiting login page without explicitly signing out, redirect to /board
  if (isAuthPage && sessionToken && !isSignedOut) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  // 3. If root path '/', redirect to board if logged in, else login
  if (pathname === "/") {
    const target = sessionToken ? "/board" : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static image and media assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
