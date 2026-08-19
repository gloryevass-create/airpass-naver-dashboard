"use client";

import { useMemo, useState, useTransition } from "react";
import { scrapNotices, unscrapNotices } from "@/app/dashboard/actions/scraps";
import type { NoticeType } from "@/lib/queries/scraps";

/** 조달입찰공고/조달사전규격 목록 공통 — 체크박스로 여러 건을 골라 스크랩에 담거나
 * 스크랩에서 빼고, "전체"/"스크랩" 탭으로 보기 범위를 전환한다. */
export function useScrapToolbar(noticeType: NoticeType, path: string) {
  const [view, setView] = useState<"all" | "scrap">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(ids: string[]) {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function switchView(next: "all" | "scrap") {
    setView(next);
    clearSelection();
  }

  function scrapSelected() {
    const ids = Array.from(selected);
    startTransition(async () => {
      await scrapNotices(noticeType, ids, path);
      clearSelection();
    });
  }

  function unscrapSelected() {
    const ids = Array.from(selected);
    startTransition(async () => {
      await unscrapNotices(noticeType, ids, path);
      clearSelection();
    });
  }

  return useMemo(
    () => ({
      view,
      switchView,
      selected,
      toggle,
      toggleAll,
      clearSelection,
      scrapSelected,
      unscrapSelected,
      pending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, selected, pending]
  );
}
