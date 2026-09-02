import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const payload = await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value);
  const loggedIn = payload?.role === "admin";

  if (pathname === "/admin/login") {
    if (loggedIn) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  if (!loggedIn) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
