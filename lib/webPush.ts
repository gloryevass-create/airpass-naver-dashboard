import "server-only";
import webPush from "web-push";

export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@airpass.co.kr";

export const isWebPushConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (isWebPushConfigured) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type PushSubscriptionRow = { endpoint: string; p256dh: string; auth: string };

/** 실패 시 만료 여부(410/404 — 구독이 더 이상 유효하지 않음)를 함께 돌려준다.
 * 호출부(크론)가 만료된 구독을 DB에서 지울 수 있게. */
export async function sendPush(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: true } | { ok: false; expired: boolean; message: string }> {
  if (!isWebPushConfigured) return { ok: false, expired: false, message: "web push 미설정" };

  try {
    await webPush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (e) {
    const statusCode = e && typeof e === "object" && "statusCode" in e ? Number((e as { statusCode: unknown }).statusCode) : 0;
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, expired: statusCode === 404 || statusCode === 410, message };
  }
}
