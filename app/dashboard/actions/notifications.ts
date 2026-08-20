"use server";

import { requireAuthedClient } from "@/lib/supabase/authed";
import { getNotifications, type Notification } from "@/lib/queries/notifications";

/** NotificationBell이 주기적으로(폴링) 불러 최신 알림 목록을 새로고침한다 —
 * Supabase Realtime 웹소켓이 끊기거나 안 오는 경우에도 최신 상태가 보장되도록
 * 하는 안전망이다(실측 확인, 2026-08-20: realtime 브로드캐스트가 구독은 SUBSCRIBED
 * 상태인데도 이벤트를 못 받는 문제가 있었음). */
export async function fetchMyNotifications(): Promise<Notification[]> {
  const { supabase, user } = await requireAuthedClient();
  return getNotifications(supabase, user.id);
}

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
