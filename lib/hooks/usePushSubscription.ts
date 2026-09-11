"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/dashboard/actions/push";

export type PushSubscriptionStatus = "idle" | "unsupported" | "denied" | "granted" | "loading";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer;
}

// 할 일 알람 배너(TodoBoard)와 헤더의 알림벨 푸시 토글(PushNotificationToggle)이
// 같은 구독 로직을 쓰길래(2026-09-12) 공용 훅으로 뽑았다 — 둘 다 같은
// push_subscriptions 행을 만든다(구독 하나로 두 종류의 알림을 모두 받음).
export function usePushSubscription() {
  const [status, setStatus] = useState<PushSubscriptionStatus>("idle");

  // 알림 지원 여부·권한 상태는 브라우저에서만 읽을 수 있어(Notification API)
  // 마운트 후에 반영한다 — 서버 렌더링 HTML과 클라이언트 초기값이 달라지는
  // 하이드레이션 경고를 피하기 위함(IndustryEventCalendar.tsx와 동일한 패턴).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission === "granted" ? "granted" : "idle");
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setStatus("unsupported");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const json = subscription.toJSON();
      await savePushSubscription({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      });
      setStatus("granted");
    } catch {
      setStatus("denied");
    }
  }

  return { status, enable };
}
