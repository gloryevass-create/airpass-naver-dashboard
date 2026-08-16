"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다 (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
