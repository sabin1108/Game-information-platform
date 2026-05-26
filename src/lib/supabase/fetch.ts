export function createSupabaseFetch(timeoutMs = 6000): typeof fetch {
  return async (input, init) => {
    if (init?.signal) {
      return fetch(input, init);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}
