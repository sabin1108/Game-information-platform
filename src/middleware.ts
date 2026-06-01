import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { updateSession } = await import("@/lib/supabase/middleware");

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
