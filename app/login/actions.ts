"use server";

import { headers } from "next/headers";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { createAdminClient } from "@/lib/supabase/admin";

/** 로그인 성공 직후 클라이언트(LoginForm)에서 호출한다 — 최근 로그인 시각·접속 IP를
 * profiles에 기록한다. profiles에는 authenticated용 self-update 정책이 없으므로(같은
 * 행에 role 컬럼도 있어 사용자가 자기 role을 admin으로 바꿔치기하는 걸 막기 위해
 * 의도적으로 없음) admin(service_role) 클라이언트로 로그인한 본인 행만 갱신한다. */
export async function recordLogin() {
  const { user } = await requireAuthedClient();

  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || h.get("x-real-ip") || null;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ last_login_at: new Date().toISOString(), last_login_ip: ip })
    .eq("id", user.id);
}
