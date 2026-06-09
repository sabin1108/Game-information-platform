export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise.finally(() => {
      if (timeout) {
        clearTimeout(timeout);
      }
    }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

export function clampNumber(value: number | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}
