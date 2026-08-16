import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/** Server Component/Action/Route Handler에서 쓰는 쿠키 기반 클라이언트.
 * Supabase 환경변수가 없으면 null을 반환한다(초기 설정 전 /login에 안내 문구를 띄우기 위함). */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component에서 호출되면 무시됨 — proxy.ts가 세션 갱신을 담당한다.
        }
      },
    },
  });
}
