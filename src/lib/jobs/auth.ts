import "server-only";

import { timingSafeEqual } from "node:crypto";
import { requireJobSecret } from "@/lib/env";

function toBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

function safeEquals(left: string, right: string) {
  const leftBuffer = toBuffer(left);
  const rightBuffer = toBuffer(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function authorizeJobRequest(request: Request) {
  const expectedSecret = requireJobSecret();
  const headerSecret = request.headers.get("x-job-secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  const providedSecret = headerSecret ?? bearerSecret;

  if (!providedSecret || !safeEquals(providedSecret, expectedSecret)) {
    return false;
  }

  return true;
}
