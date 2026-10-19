/**
 * Public demo build (`EXPO_PUBLIC_DEMO=true`): no backend and no login.
 *
 * The web build loads fictional sample data into the in-memory cache that db/database.web.ts already uses, never
 * creates a Supabase client and makes no network requests. Visitors can add or delete entries to try the app, but
 * every change only lives in their browser's memory and is gone on reload. Off by default, so normal builds (and the
 * Android app) are unaffected.
 */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === "true";

export const DEMO_LINKS = {
  repository: "https://github.com/jovermprs-dev/Koin",
  portfolio: "https://sergiojover.dev",
} as const;
