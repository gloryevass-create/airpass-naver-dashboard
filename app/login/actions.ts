"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RecordLoginResult = { ok: boolean; detail: string };

/** 로그인 성공 직후 클라이언트(LoginForm)에서 호출한다 — 최근 로그인 시각·접속 IP를
 * profiles에 기록한다. profiles에는 authenticated용 self-update 정책이 없으므로(같은
 * 행에 role 컬럼도 있어 사용자가 자기 role을 admin으로 바꿔치기하는 걸 막기 위해
 * 의도적으로 없음) admin(service_role) 클라이언트로 로그인한 본인 행만 갱신한다.
 *
 * requireAuthedClient()는 세션이 안 보이면 redirect("/login")를 던지는데, 이 액션
 * 안에서 그게 발생하면 로그인 직후 이상한 곳으로 튕길 수 있어(그리고 실패 원인이
 * 안 보여서) 쓰지 않는다 — 대신 직접 세션을 확인한다.
 *
 * (임시) 서버 콘솔 로그를 이 환경에서 실시간으로 확인하기 어려워, 실패 원인을
 * 호출부(LoginForm)에 화면으로 보여줄 수 있도록 결과를 반환한다 — 원인 파악 후
 * 제거 예정. */
export async function recordLogin(): Promise<RecordLoginResult> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { ok: false, detail: "Supabase 클라이언트를 만들지 못함(환경변수 미설정)" };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, detail: `세션에서 user를 찾지 못함: ${userError?.message ?? "(에러 없음)"}` };
    }

    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || h.get("x-real-ip") || null;

    const admin = createAdminClient();
    const { error, data } = await admin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString(), last_login_ip: ip })
      .eq("id", user.id)
      .select();

    if (error) {
      return { ok: false, detail: `profiles 업데이트 실패: ${error.message}` };
    }

    return { ok: true, detail: `성공 — user=${user.id}, ip=${ip}, 갱신행수=${data?.length ?? 0}` };
  } catch (e) {
    return { ok: false, detail: `예외: ${e instanceof Error ? e.message : String(e)}` };
  }
}
