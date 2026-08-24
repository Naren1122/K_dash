import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Ensure `self` is defined in Node.js/Edge environments if bundled third-party packages access it
if (typeof (globalThis as unknown as { self: unknown }).self === "undefined") {
  (globalThis as unknown as { self: unknown }).self = globalThis;
}

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;
  const { pathname, search } = req.nextUrl;
  const baseUrl = req.url;

  const isLoginPage = pathname === "/login";
  const isAdminPage = pathname.startsWith("/admin");

  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/board", baseUrl));
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
}

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
