export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  itadApiKey: process.env.ITAD_API_KEY,
  itadEnableLocalDev: process.env.ITAD_ENABLE_LOCAL_DEV,
  authDevSkipEmailConfirmation: process.env.AUTH_DEV_SKIP_EMAIL_CONFIRMATION,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  posthogToken: process.env.NEXT_PUBLIC_POSTHOG_TOKEN,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  sentryDsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  publicSentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  jobSecret: process.env.JOB_SECRET
};

function isLocalSupabaseUrl(url: URL) {
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  );
}

export function isValidSupabaseUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.hostname.endsWith(".supabase.co") ||
      isLocalSupabaseUrl(url)
    );
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  return Boolean(isValidSupabaseUrl(env.supabaseUrl) && env.supabaseAnonKey);
}

export function isItadConfigured() {
  if (
    process.env.NODE_ENV === "development" &&
    isLocalAppUrl() &&
    env.itadEnableLocalDev !== "true"
  ) {
    return false;
  }

  return Boolean(env.itadApiKey);
}

export function isPostHogConfigured() {
  return Boolean(env.posthogToken && env.posthogHost);
}

export function isSentryConfigured() {
  return Boolean(env.sentryDsn);
}

export function isLocalAppUrl() {
  try {
    const url = new URL(env.appUrl);

    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function shouldSkipEmailConfirmationInDev() {
  return Boolean(
    env.authDevSkipEmailConfirmation === "true" &&
      isLocalAppUrl() &&
      env.supabaseServiceRoleKey
  );
}

export function requireSupabaseEnv() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (!isValidSupabaseUrl(env.supabaseUrl)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a project API URL like https://<project-ref>.supabase.co, not the dashboard URL.");
  }

  return {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey
  };
}

export function requireSupabaseAdminEnv() {
  const { url } = requireSupabaseEnv();

  if (!env.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return {
    url,
    serviceRoleKey: env.supabaseServiceRoleKey
  };
}

export function requireItadEnv() {
  if (!env.itadApiKey) {
    throw new Error("ITAD_API_KEY is not configured.");
  }

  return {
    apiKey: env.itadApiKey
  };
}

export function requireJobSecret() {
  if (!env.jobSecret) {
    throw new Error("JOB_SECRET is not configured.");
  }

  return env.jobSecret;
}
