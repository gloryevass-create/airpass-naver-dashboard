"use client";

import { NavIcon } from "@/components/icons/NavIcon";
import { usePushSubscription } from "@/lib/hooks/usePushSubscription";

// 알림벨(NotificationBell) 옆의 브라우저 푸시 켜기 버튼(2026-09-12) — 할 일
// 페이지에만 있던 "알림 허용" 배너와 같은 구독을 만들지만, 할 일을 안 쓰는
// 팀원도 알림벨 푸시(사업변경/메모/유튜브업로드 등)를 켤 수 있도록 헤더에도
// 둔다. 이미 켜져 있거나(granted) 브라우저가 지원 안 하면(unsupported)
// 아예 숨긴다 — denied는 브라우저 설정에서 직접 풀어야 해서 안내 툴팁만
// 보여주고 클릭해도 동작하지 않는다(재요청해도 브라우저가 다시 안 물어봄).
export function PushNotificationToggle() {
  const { status, enable } = usePushSubscription();

  if (status === "granted" || status === "unsupported") return null;

  if (status === "denied") {
    return (
      <span
        title="브라우저 알림이 차단되어 있습니다. 브라우저 설정에서 이 사이트 알림을 허용해주세요."
        className="flex h-8 w-8 items-center justify-center text-white/30"
      >
        <NavIcon name="bell" className="h-4 w-4" />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={status === "loading"}
      title="브라우저 알림 켜기"
      aria-label="브라우저 알림 켜기"
      className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-white/70 transition-colors hover:border-white/20 hover:text-white"
    >
      <NavIcon name="bell" className="h-4 w-4" />
    </button>
  );
}
