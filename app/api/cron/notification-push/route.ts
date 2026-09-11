import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/webPush";

// 알림벨 브라우저 푸시(2026-09-12) — DB 트리거(0069)가 notifications에 새 행이
// 생길 때마다 notification_push_queue에 큐잉해두면, 이 크론이 5분마다 돌면서
// 아직 안 보낸 큐 항목을 찾아 구독한 팀원 전원에게 발송한다. 할 일 알람
// 크론(todo-alarms)과 같은 이유로 Vercel Cron이 아니라 외부 무료 스케줄러가
// 호출한다(Vercel Hobby 플랜의 cron 하루 1회 제한).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: queued, error: fetchError } = await admin
    .from("notification_push_queue")
    .select("id, notification_id")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error("[cron/notification-push] 큐 조회 실패:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!queued || queued.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, notifications: 0 });
  }

  const notificationIds = [...new Set(queued.map((q) => q.notification_id))];
  const [{ data: notifications }, { data: subscriptions }] = await Promise.all([
    admin.from("notifications").select("id, title, message, link").in("id", notificationIds),
    admin.from("push_subscriptions").select("id, endpoint, p256dh, auth"),
  ]);

  let sentCount = 0;
  const expiredSubscriptionIds = new Set<string>();

  for (const notification of notifications ?? []) {
    for (const sub of subscriptions ?? []) {
      const result = await sendPush(sub, {
        title: notification.title,
        body: notification.message ?? "",
        url: notification.link ?? "/dashboard",
      });
      if (result.ok) sentCount += 1;
      else if (result.expired) expiredSubscriptionIds.add(sub.id);
    }
  }

  await admin
    .from("notification_push_queue")
    .update({ processed: true })
    .in("id", queued.map((q) => q.id));

  if (expiredSubscriptionIds.size > 0) {
    await admin.from("push_subscriptions").delete().in("id", [...expiredSubscriptionIds]);
  }

  return NextResponse.json({ ok: true, sent: sentCount, notifications: notifications?.length ?? 0 });
}
