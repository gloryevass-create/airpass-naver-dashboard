"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 로그인 성공 직후 클라이언트(LoginForm)에서 호출한다 — 최근 로그인 시각·접속 IP를
 * profiles에 기록한다. profiles에는 authenticated용 self-update 정책이 없으므로(같은
 * 행에 role 컬럼도 있어 사용자가 자기 role을 admin으로 바꿔치기하는 걸 막기 위해
 * 의도적으로 없음) admin(service_role) 클라이언트로 로그인한 본인 행만 갱신한다.
 *
 * requireAuthedClient()는 세션이 안 보이면 redirect("/login")를 던지는데, 이 액션
 * 안에서 그게 발생하면 로그인 직후 이상한 곳으로 튕길 수 있어(그리고 실패 원인이
 * 안 보여서) 쓰지 않는다 — 대신 직접 세션을 확인하고, 실패해도 그냥 조용히
 * 리턴하되 서버 로그에는 원인을 남긴다. */
export async function recordLogin() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error("[recordLogin] Supabase 클라이언트를 만들지 못함(환경변수 미설정)");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("[recordLogin] 세션에서 user를 찾지 못함", userError?.message);
      return;
    }

    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || h.get("x-real-ip") || null;

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString(), last_login_ip: ip })
      .eq("id", user.id);

    if (error) {
      console.error("[recordLogin] profiles 업데이트 실패:", error.message);
    }
  } catch (e) {
    console.error("[recordLogin] 예외:", e instanceof Error ? e.message : e);
  }
}
