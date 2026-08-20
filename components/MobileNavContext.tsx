"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MobileNavState = { open: boolean; toggle: () => void; close: () => void };

const MobileNavContext = createContext<MobileNavState | null>(null);

/** 헤더의 햄버거 버튼과 사이드바의 드로어 열림 상태를 공유한다 — 둘 다 layout.tsx의
 * 형제 컴포넌트라 props로 직접 전달할 수 없어 컨텍스트로 묶는다. */
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav(): MobileNavState {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within MobileNavProvider");
  return ctx;
}
