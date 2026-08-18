import { NextResponse } from "next/server";
import { auth } from "../auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const { pathname, search } = req.nextUrl;
  const baseUrl = req.url;

  const isLoginPage = pathname === "/login";
  const isAdminPage = pathname.startsWith("/admin");

  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const callbackUrl = pathname + (search || "");
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, baseUrl)
    );
  }

  if (isAdminPage && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/403", baseUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public images
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};