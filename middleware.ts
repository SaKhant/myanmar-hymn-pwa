import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/hymns\/matu\/(\d+)$/);
  if (!match) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/matu-hymns/${match[1]}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/hymns/matu/:path*"],
};
