import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { isSupabaseAdminConfigured, supabaseServiceRoleKey, supabaseUrl } from "./env";

/** service_role 키를 쓰는 관리자 전용 클라이언트.
 * 절대 클라이언트 컴포넌트/브라우저 번들로 흘러가면 안 된다 — `server-only`로 강제.
 * 오직 관리자 초대 API(app/admin/actions.ts)에서만 사용한다. */
export function createAdminClient() {
  if (!isSupabaseAdminConfigured) {
    throw new Error(
      "Supabase 관리자 환경변수가 설정되지 않았습니다 (SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
