import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 2026-08-30 URL 경로 변경(events2→calendar, business3→business) 이전에 저장된
  // notifications.link 등 옛 경로를 가리키는 링크(알림 벨 딥링크, 북마크)가 깨지지
  // 않게 리다이렉트한다 — permanent: false로 둬서 브라우저가 과도하게 캐시하지
  // 않게 한다(나중에 필요하면 조정 가능하도록).
  async redirects() {
    return [
      { source: "/dashboard/events2", destination: "/dashboard/calendar", permanent: false },
      { source: "/dashboard/events2/:path*", destination: "/dashboard/calendar/:path*", permanent: false },
      { source: "/dashboard/business3", destination: "/dashboard/business", permanent: false },
      { source: "/dashboard/business3/:path*", destination: "/dashboard/business/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
