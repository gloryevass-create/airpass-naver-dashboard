"use server";

import { requireAuthedClient } from "@/lib/supabase/authed";

/** 알림 하나를 이 사용자에게 읽음 처리한다. 이미 읽었으면 조용히 무시한다
 * (onConflict do nothing) — 다른 팀원의 읽음 상태에는 영향을 주지 않는다. */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const { supabase, user } = await requireAuthedClient();

  await supabase
    .from("notification_reads")
    .upsert(
      { notification_id: notificationId, user_id: user.id },
      { onConflict: "notification_id,user_id", ignoreDuplicates: true }
    );
}

/** 현재 화면에 보이는 안읽음 알림 전체를 이 사용자에게 한 번에 읽음 처리한다. */
export async function markAllNotificationsRead(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  const { supabase, user } = await requireAuthedClient();

  const rows = notificationIds.map((notificationId) => ({ notification_id: notificationId, user_id: user.id }));
  await supabase
    .from("notification_reads")
    .upsert(rows, { onConflict: "notification_id,user_id", ignoreDuplicates: true });
}
