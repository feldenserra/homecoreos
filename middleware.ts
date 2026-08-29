import { NextResponse, type NextRequest } from "next/server";
import { isRunningLocal } from "./lib/running-local";

function hasSessionCookie(req: NextRequest) {
  return Boolean(
    req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value,
  );
}

export function middleware(req: NextRequest) {
  if (!isRunningLocal() && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (req.nextUrl.pathname.startsWith("/app") && !hasSessionCookie(req)) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
