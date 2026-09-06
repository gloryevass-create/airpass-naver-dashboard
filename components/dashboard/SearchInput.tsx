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
