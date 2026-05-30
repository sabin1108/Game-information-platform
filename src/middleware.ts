import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isLocalAppUrl } from "@/lib/env";

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development" && isLocalAppUrl()) {
    return NextResponse.next({ request });
  }

  const { updateSession } = await import("@/lib/supabase/middleware");

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
