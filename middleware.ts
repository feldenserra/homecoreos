import { NextResponse, type NextRequest } from "next/server";
import { loginsAllowed } from "./lib/allow-logins";

function hasSessionCookie(req: NextRequest) {
  return Boolean(
    req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value,
  );
}

const LOGIN_PREFIXES = ["/login", "/signup", "/app", "/api/auth", "/api/chat"];

function isLoginPath(pathname: string) {
  return LOGIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(req: NextRequest) {
  if (!loginsAllowed() && isLoginPath(req.nextUrl.pathname)) {
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
