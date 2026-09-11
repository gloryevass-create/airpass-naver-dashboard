import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/webPush";

// 할 일 알람(2026-09-11) — Vercel Cron이 5분마다 호출해 alarm_at이 지났고
// 아직 안 보냈고 완료되지 않은 할 일을 찾아 소유자의 모든 브라우저 구독에
// 푸시를 보낸다. AI Issue 크론과 같은 인증 방식(Authorization: Bearer
// $CRON_SECRET, Vercel이 자동으로 붙임).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: dueTodos, error: fetchError } = await admin
    .from("todos")
    .select("id, owner_id, title, due_date")
    .eq("alarm_sent", false)
    .eq("is_completed", false)
    .not("alarm_at", "is", null)
    .lte("alarm_at", new Date().toISOString());

  if (fetchError) {
    console.error("[cron/todo-alarms] 조회 실패:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!dueTodos || dueTodos.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, due: 0 });
  }

  const ownerIds = [...new Set(dueTodos.map((t) => t.owner_id))];
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", ownerIds);

  const subsByOwner = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions ?? []) {
    const list = subsByOwner.get(sub.user_id) ?? [];
    list.push(sub);
    subsByOwner.set(sub.user_id, list);
  }

  let sentCount = 0;
  const expiredSubscriptionIds: string[] = [];

  for (const todo of dueTodos) {
    const subs = subsByOwner.get(todo.owner_id) ?? [];
    for (const sub of subs) {
      const result = await sendPush(sub, {
        title: "할 일 알림",
        body: todo.due_date ? `${todo.title} (기한: ${todo.due_date})` : todo.title,
        url: "/dashboard/todos",
      });
      if (result.ok) {
        sentCount += 1;
      } else if (result.expired) {
        expiredSubscriptionIds.push(sub.id);
      } else {
        console.error(`[cron/todo-alarms] 발송 실패 (todo ${todo.id}):`, result.message);
      }
    }
    // 구독이 하나도 없어도(아직 알림 권한을 안 받은 사용자) 같은 알람을 매번
    // 다시 검사하지 않도록 발송 시도 자체로 alarm_sent를 채운다.
    await admin.from("todos").update({ alarm_sent: true }).eq("id", todo.id);
  }

  if (expiredSubscriptionIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredSubscriptionIds);
  }

  return NextResponse.json({ ok: true, sent: sentCount, due: dueTodos.length, expiredRemoved: expiredSubscriptionIds.length });
}
