import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, DEV_COOKIE, verifyToken } from "@/lib/auth";

const AREAS = [
  { prefix: "/admin", cookie: ADMIN_COOKIE, role: "admin", login: "/admin/login" },
  {
    prefix: "/developer",
    cookie: DEV_COOKIE,
    role: "developer",
    login: "/developer/login",
  },
] as const;

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const area = AREAS.find((a) => pathname.startsWith(a.prefix));
  if (!area) return NextResponse.next();

  const payload = await verifyToken(req.cookies.get(area.cookie)?.value);
  const loggedIn = payload?.role === area.role;

  if (pathname === area.login) {
    if (loggedIn) return NextResponse.redirect(new URL(area.prefix, req.url));
    return NextResponse.next();
  }

  if (!loggedIn) {
    const url = new URL(area.login, req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/developer/:path*"],
};
