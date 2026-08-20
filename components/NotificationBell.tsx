"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavIcon } from "@/components/icons/NavIcon";
import { markNotificationRead, markAllNotificationsRead } from "@/app/dashboard/actions/notifications";
import type { Notification, NotificationType } from "@/lib/queries/notifications";

const TYPE_LABEL: Record<NotificationType, string> = {
  event: "일정",
  business: "비즈니스",
  youtube: "유튜브",
  budget_low: "광고비",
  memo: "메모",
  budget_scrap: "입찰공고",
  prespec_scrap: "사전규격",
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

type RealtimeNotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  created_at: string;
};

export function NotificationBell({
  initialNotifications,
}: {
  initialNotifications: Notification[];
  userId: string;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 팀 공유 알림 피드라 새 알림이 생기면(파이프라인 diff, 메모 작성, 스크랩 등) 화면을
  // 새로고침하지 않아도 실시간으로 뜬다(Supabase Realtime, 0026 마이그레이션에서
  // publication에 추가함).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as RealtimeNotificationRow;
          setNotifications((prev) =>
            [
              {
                id: row.id,
                type: row.type,
                title: row.title,
                message: row.message,
                link: row.link,
                createdAt: row.created_at,
                isRead: false,
              },
              ...prev,
            ].slice(0, 30)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = notifications.filter((n) => !n.isRead);

  function handleClickNotification(n: Notification) {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markNotificationRead(n.id).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  function handleMarkAllRead() {
    const ids = unread.map((n) => n.id);
    if (ids.length === 0) return;
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    markAllNotificationsRead(ids).catch(() => {});
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="알림"
        className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
          open ? "border-white/40 text-white" : "border-transparent text-white/70 hover:border-white/20 hover:text-white"
        }`}
      >
        <NavIcon name="bell" className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-semantic-error px-1 text-[10px] font-bold text-white">
            {unread.length > 99 ? "99+" : unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 flex max-h-[28rem] w-80 flex-col overflow-hidden rounded-md border border-hairline bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
            <span className="text-sm font-semibold text-ink">알림</span>
            {unread.length > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs text-link-blue hover:underline">
                모두 읽음
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-mute">알림이 없습니다.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotification(n)}
                  className={`flex w-full flex-col gap-1 border-b border-hairline px-3 py-2.5 text-left last:border-b-0 hover:bg-canvas-cream ${
                    n.isRead ? "" : "bg-canvas-lavender/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="rounded bg-canvas-lavender px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {TYPE_LABEL[n.type]}
                      </span>
                      {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-semantic-error" />}
                    </span>
                    <span className="text-[11px] text-ink-mute">{relativeTime(n.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  {n.message && <p className="text-xs text-ink-mute">{n.message}</p>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
