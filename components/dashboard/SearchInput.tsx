"use client";

import type { CSSProperties } from "react";

// AI HUB 세 화면(AiToolsBoard/AiReviewList/AiIssueList)이 똑같은 모양의 검색창을
// 쓰길래(2026-09-06) 돋보기 아이콘 오버레이까지 포함해 공용 컴포넌트로 뽑았다 —
// QuotationBoard.tsx의 SearchIcon(버튼 안에 쓰는 용도)과 달리 이건 텍스트 입력칸
// 왼쪽에 겹쳐 놓는 용도라 별도로 만들었다.
export function SearchInput({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ position: "relative", maxWidth: 320, marginBottom: "var(--space-4)", ...style }}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: 30, width: "100%" }}
      />
    </div>
  );
}

// 공공데이터 DB 목록 화면들(청소년수련시설/장애인단체 등)은 Industry 테마가 아니라
// 일반 Tailwind 톤을 쓰기 때문에(className="input"이 없음) 위 SearchInput을 그대로
// 못 쓴다 — 같은 돋보기 아이콘을 그 화면들에도 일괄 적용하려고 Tailwind 버전을
// 별도로 뽑았다(2026-09-07).
export function SearchIconInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute opacity-70"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-sm border border-hairline py-1.5 pl-8 pr-3 text-ink outline-none focus:border-primary ${className ?? ""}`}
      />
    </div>
  );
}
