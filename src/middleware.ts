import type { NextRequest } from "next/server";
import { ANONYMOUS_ID_COOKIE } from "@/lib/experiment-constants";

export async function middleware(request: NextRequest) {
  let anonymousId = request.cookies.get(ANONYMOUS_ID_COOKIE)?.value;

  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    request.cookies.set(ANONYMOUS_ID_COOKIE, anonymousId);
  }

  const { updateSession } = await import("@/lib/supabase/middleware");

  const response = await updateSession(request);

  if (!response.cookies.has(ANONYMOUS_ID_COOKIE)) {
    response.cookies.set(ANONYMOUS_ID_COOKIE, anonymousId, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
