// 할 일 알람 전용 최소 서비스워커(2026-09-11) — 오프라인 캐싱 등 PWA 기능은
// 다루지 않는다, 오직 Web Push 수신·표시·클릭 처리만 한다.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title || "할 일 알림", {
      body: payload.body || "",
      icon: "/favicon.ico",
      data: { url: payload.url || "/dashboard/todos" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard/todos";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
