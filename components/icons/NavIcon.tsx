import type { SVGProps } from "react";

// 서버/클라이언트 컴포넌트 어디서든 그대로 쓸 수 있도록 훅 없이 순수 렌더 함수로 둔다
// (사이드바 메뉴 아이콘과 각 페이지 제목 아이콘이 이 파일을 함께 쓴다).
export type IconName = "search" | "document" | "clipboard" | "newspaper" | "megaphone" | "play";

export function NavIcon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "search":
      return (
        <svg {...shared} {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "document":
      return (
        <svg {...shared} {...props}>
          <path d="M7 3h6l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M13 3v5h5" />
          <path d="M9 13h6M9 17h6" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...shared} {...props}>
          <rect x="6" y="4" width="12" height="17" rx="2" />
          <path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" />
          <path d="M9 11h6M9 15h6" />
        </svg>
      );
    case "newspaper":
      return (
        <svg {...shared} {...props}>
          <rect x="3" y="5" width="13" height="15" rx="1" />
          <path d="M16 8h3.5a.5.5 0 0 1 .5.5V18a2 2 0 0 1-2 2H6" />
          <path d="M6.5 9h6M6.5 12h6M6.5 15h4" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...shared} {...props}>
          <path d="M3 10.5v3a1 1 0 0 0 1 1h1.8L10 19v-13l-4.2 4.5H4a1 1 0 0 0-1 1z" />
          <path d="M14 9a4 4 0 0 1 0 6" />
          <path d="M17 6.5a8 8 0 0 1 0 11" />
        </svg>
      );
    case "play":
      return (
        <svg {...shared} {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
