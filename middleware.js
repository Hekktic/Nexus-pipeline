import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie-name";
import { expectedSessionToken } from "@/lib/session-edge";

const PUBLIC_PREFIXES = ["/login"];

function isPublic(pathname) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const expected = await expectedSessionToken();
  const authed = Boolean(cookie) && cookie === expected;

  if (!authed && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (authed && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
