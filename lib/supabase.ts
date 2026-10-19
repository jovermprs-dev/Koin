import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { DEMO } from "@/lib/demo";

// expo-secure-store has no web implementation, so the auth session storage
// falls back to localStorage on web and stays on SecureStore natively.
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const webStorageAdapter = {
  getItem: (key: string) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
  setItem: (key: string, value: string) => {
    globalThis.localStorage?.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    globalThis.localStorage?.removeItem(key);
    return Promise.resolve();
  },
};

// In the public demo build there is no backend: no client is created and any accidental use fails loudly instead of
// silently reaching for the network.
export const supabase: SupabaseClient = DEMO
  ? (new Proxy({}, {
      get() {
        throw new Error("Supabase is disabled in the demo build.");
      },
    }) as SupabaseClient)
  : createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        storage: Platform.OS === "web" ? webStorageAdapter : secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
