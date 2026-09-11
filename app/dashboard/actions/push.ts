"use server";

import { requireAuthedClient } from "@/lib/supabase/authed";

// Web Push 구독 저장/삭제 — 할 일 알람(app/api/cron/todo-alarms)과 알림벨
// 브라우저 푸시(app/api/cron/notification-push)가 같은 push_subscriptions를
// 공유해서 쓴다(2026-09-12, 원래 todos.ts에 있던 걸 알림벨까지 확장하면서
// 이 파일로 분리 — todos 전용이 아니게 됐기 때문).
export async function savePushSubscription(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ error?: string }> {
  const { supabase, user } = await requireAuthedClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
      { onConflict: "endpoint" }
    );
  if (error) return { error: error.message };
  return {};
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { supabase, user } = await requireAuthedClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
}
