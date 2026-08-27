"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
import { AnimatePresence, Reorder, useDragControls } from "framer-motion";
import type { Quotation, QuotationItem } from "@/lib/queries/quotations";
import type { ProductCatalogItem } from "@/lib/queries/productCatalog";
import { createQuotation, updateQuotation, deleteQuotation } from "@/app/dashboard/actions/quotations";
import { QUOTATION_SUPPLIER } from "@/lib/quotationCompany";
import { NavIcon } from "@/components/icons/NavIcon";

function formatCurrency(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyItem(): QuotationItem {
  return {
    id: crypto.randomUUID(),
    productId: null,
    name: "",
    specification: "",
    unit: "EA",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    note: "",
  };
}

const FIELD_CLASS =
  "rounded-sm border border-hairline bg-canvas-cream px-3 py-1.5 text-sm text-ink outline-none focus:border-primary";
// 표 안의 입력칸은 평소엔 일반 표 텍스트처럼 보이다가(테두리 없음) 포커스했을 때만
// 입력 중임을 보여준다 — 편집 가능한 셀이라는 걸 알 수 있으면서도 표가 입력창들로
// 빽빽해 보이지 않게 한다(레퍼런스 디자인 참고, 2026-08-27).
const CELL_FIELD_CLASS =
  "w-full rounded-sm border border-transparent bg-transparent px-1.5 py-1 text-xs text-ink outline-none focus:border-hairline focus:bg-canvas-cream";
// 드래그·품목 추가/삭제 시 framer-motion이 각 행을 부드럽게 슬라이드시킬 수 있도록
// <table>이 아니라 CSS 그리드로 "표처럼 보이는" 레이아웃을 구성한다 — 실제 <tr>은
// display:table-row라 transform 애니메이션이 브라우저에 따라 제대로 안 먹는다.
const ITEM_GRID_COLS = "32px 40px minmax(160px,1.4fr) minmax(140px,1fr) 64px 56px 108px 108px minmax(96px,1fr) 40px";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-t border-hairline first:border-t-0">
      <div className="w-24 shrink-0 border-r border-hairline bg-background px-2 py-1.5 text-center text-[11px] font-medium text-ink-mute">
        {label}
      </div>
      <div className="flex-1 px-3 py-1.5 text-center text-[11px] font-bold text-[#4b5563]">{value}</div>
    </div>
  );
}

function InfoSplitRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    <div className="flex border-t border-hairline">
      <div className="w-24 shrink-0 border-r border-hairline bg-background px-2 py-1.5 text-center text-[11px] font-medium text-ink-mute">
        {leftLabel}
      </div>
      <div className="flex-1 border-r border-hairline px-3 py-1.5 text-center text-[11px] font-bold text-[#4b5563]">
        {leftValue}
      </div>
      <div className="w-24 shrink-0 border-r border-hairline bg-background px-2 py-1.5 text-center text-[11px] font-medium text-ink-mute">
        {rightLabel}
      </div>
      <div className="flex-1 px-3 py-1.5 text-center text-[11px] font-bold text-[#4b5563]">{rightValue}</div>
    </div>
  );
}

/** 견적정보 박스 안에서 SI Business(business_projects_v2) 프로젝트를 검색해
 * 견적서와 연결한다 — 연결해두면 그 프로젝트 상세 화면에서도 이 견적서를 볼 수
 * 있다(사용자 확인, 2026-08-27). */
function BusinessProjectField({
  projects,
  value,
  onChange,
}: {
  projects: { id: string; title: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = projects.find((p) => p.id === value) ?? null;

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.title.toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <div ref={ref} className="relative flex border-t border-hairline">
      <div className="w-24 shrink-0 border-r border-hairline bg-background px-2 py-1.5 text-center text-[11px] font-medium text-ink-mute">
        연결 사업
      </div>
      <div className="relative flex-1">
        <input
          type="text"
          value={selected ? selected.title : query}
          onChange={(e) => {
            if (selected) onChange(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="SI Business 프로젝트 검색"
          className="w-full border-0 bg-canvas-cream px-3 py-1.5 pr-6 text-center text-[11px] font-bold text-[#4b5563] outline-none focus:bg-background"
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            aria-label="연결 해제"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink"
          >
            ✕
          </button>
        )}
        {open && !selected && filtered.length > 0 && (
          <div className="absolute inset-x-0 top-full z-10 max-h-48 overflow-y-auto rounded-b-sm border border-t-0 border-hairline bg-canvas-cream shadow-md">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-background"
              >
                {p.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 방금 검색해서 추가한 품목이라 아직 아무것도 손대지 않은 "빈 직접입력 행"이면
 * 그 자리를 대신 채우고, 그렇지 않으면 새 행으로 덧붙인다 — 검색으로 여러 개를
 * 연속 선택할 때마다 매번 빈 행이 하나씩 남는 것을 막는다. */
function isBlankItem(item: QuotationItem): boolean {
  return !item.productId && !item.name && item.unitPrice === 0;
}

function itemFromProduct(p: ProductCatalogItem): QuotationItem {
  const unitPrice = p.unitPrice ?? 0;
  return {
    id: crypto.randomUUID(),
    productId: p.id,
    name: p.name,
    specification: p.specification ?? "",
    unit: "EA",
    quantity: 1,
    unitPrice,
    amount: unitPrice,
    note: "",
  };
}

/** 드래그 핸들(⠿)에서 포인터를 누를 때만 드래그가 시작되도록
 * dragListener={false} + useDragControls를 쓴다 — 그래야 행 안의 입력칸을
 * 클릭·드래그해서 텍스트를 선택하는 동작과 충돌하지 않는다. framer-motion의
 * Reorder는 네이티브 HTML5 드래그(품목 순서 변경에서 이전에 쓰던 방식)와 달리
 * 포인터 위치를 그대로 따라가며 다른 행들을 스프링 애니메이션으로 밀어내
 * "버벅거리지 않고 자연스럽게" 움직인다(사용자 확인, 2026-08-27). */
function ItemRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: QuotationItem;
  index: number;
  onUpdate: (patch: Partial<QuotationItem>) => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      as="div"
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileDrag={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 10 }}
      className="relative grid touch-none bg-canvas-cream text-sm"
      style={{ gridTemplateColumns: ITEM_GRID_COLS }}
    >
      <div className="flex items-center justify-center border-b border-r border-hairline px-1 py-1.5">
        <span
          onPointerDown={(e) => dragControls.start(e)}
          className="inline-block cursor-grab touch-none select-none text-ink-mute active:cursor-grabbing"
          aria-label="드래그해서 순서 변경"
        >
          ⠿
        </span>
      </div>
      <div className="flex items-center justify-center border-b border-r border-hairline px-2 py-1.5 text-xs text-ink-mute">
        {index + 1}
      </div>
      <div className="border-b border-r border-hairline px-2 py-1.5">
        <input
          value={item.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className={CELL_FIELD_CLASS}
        />
      </div>
      <div className="border-b border-r border-hairline px-2 py-1.5">
        <input
          value={item.specification}
          onChange={(e) => onUpdate({ specification: e.target.value })}
          className={CELL_FIELD_CLASS}
        />
      </div>
      <div className="border-b border-r border-hairline px-2 py-1.5">
        <input
          type="number"
          min={0}
          value={item.quantity}
          onChange={(e) => onUpdate({ quantity: Number(e.target.value) || 0 })}
          className={`${CELL_FIELD_CLASS} text-right`}
        />
      </div>
      <div className="border-b border-r border-hairline px-2 py-1.5">
        <input
          value={item.unit}
          onChange={(e) => onUpdate({ unit: e.target.value })}
          className={`${CELL_FIELD_CLASS} text-center`}
        />
      </div>
      <div className="border-b border-r border-hairline px-2 py-1.5">
        <input
          type="number"
          min={0}
          value={item.unitPrice}
          onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) || 0 })}
          className={`${CELL_FIELD_CLASS} text-right`}
        />
      </div>
      <div className="flex items-center justify-end whitespace-nowrap border-b border-r border-hairline px-2 py-1.5 text-xs font-bold tabular-nums text-ink">
        {formatCurrency(item.amount)}
      </div>
      <div className="border-b border-r border-hairline px-2 py-1.5">
        <input
          value={item.note}
          onChange={(e) => onUpdate({ note: e.target.value })}
          className={CELL_FIELD_CLASS}
        />
      </div>
      <div className="flex items-center justify-center border-b border-r border-hairline px-2 py-1.5">
        <button
          type="button"
          onClick={onRemove}
          aria-label="품목 삭제"
          className="text-semantic-error hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </Reorder.Item>
  );
}

function ItemsEditor({
  items,
  products,
  onChange,
}: {
  items: QuotationItem[];
  products: ProductCatalogItem[];
  onChange: (items: QuotationItem[]) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const favoriteCount = products.filter((p) => p.isFavorite).length;
  const filteredProducts = useMemo(() => {
    let list = favoritesOnly ? products.filter((p) => p.isFavorite) : products;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.specification ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, favoritesOnly]);

  function update(index: number, patch: Partial<QuotationItem>) {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    next[index] = { ...next[index], amount: Math.round(next[index].quantity * next[index].unitPrice) };
    onChange(next);
  }

  function addProduct(p: ProductCatalogItem) {
    const blankIndex = items.findIndex(isBlankItem);
    const newItem = itemFromProduct(p);
    if (blankIndex !== -1) {
      onChange(items.map((it, i) => (i === blankIndex ? newItem : it)));
    } else {
      onChange([...items, newItem]);
    }
    setJustAddedId(p.id);
    window.setTimeout(() => setJustAddedId((cur) => (cur === p.id ? null : cur)), 1200);
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={panelRef} className="relative flex flex-wrap items-center gap-2">
        <span className="shrink-0 rounded-full bg-background px-3 py-1.5 text-xs font-medium text-ink-mute">
          {items.length}개 품목
        </span>
        <button
          type="button"
          onClick={() => {
            setFavoritesOnly(false);
            setSearchOpen(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-canvas-lavender/40"
        >
          <NavIcon name="search" className="h-3.5 w-3.5" />
          물품 검색 ({products.length}개)
        </button>
        <button
          type="button"
          onClick={() => {
            setFavoritesOnly(true);
            setSearchOpen(true);
          }}
          className="shrink-0 rounded-full border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-canvas-lavender/40"
        >
          ★ 즐겨찾기 ({favoriteCount}개)
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem()])}
          className="shrink-0 rounded-lg border border-dashed border-hairline px-3 py-1.5 text-xs font-medium text-ink-mute hover:border-primary hover:text-primary"
        >
          + 행 추가
        </button>

        {searchOpen && (
          <div className="absolute left-0 top-full z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-sm border border-hairline bg-canvas-cream shadow-lg sm:w-1/2">
            <div className="sticky top-0 flex items-center gap-2 border-b border-hairline bg-canvas-cream px-3 py-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="물품명·규격으로 검색"
                className="min-w-0 flex-1 rounded-sm border border-hairline bg-background px-2 py-1 text-xs text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary-press"
              >
                선택 완료
              </button>
            </div>
            {filteredProducts.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-ink-mute">검색 결과가 없습니다.</p>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className={`flex w-full items-center justify-between gap-2 border-t border-hairline px-3 py-1.5 text-left first:border-t-0 hover:bg-canvas-lavender/30 ${
                    justAddedId === p.id ? "border-2 border-primary" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-ink">
                      {p.isFavorite && <span className="mr-1 text-primary">★</span>}
                      {p.name}
                    </span>
                    {p.specification && <span className="block truncate text-[11px] text-ink-mute">{p.specification}</span>}
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                    {p.unitPrice != null ? `${formatCurrency(p.unitPrice)}원` : "-"}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-sm border-l border-t border-hairline">
        <div className="min-w-[880px]">
          <div
            className="grid bg-background text-left text-xs font-medium text-ink-mute"
            style={{ gridTemplateColumns: ITEM_GRID_COLS }}
          >
            <div className="border-b border-r border-hairline px-2 py-2.5" />
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5">No</div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5">품명 *</div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5">규격</div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5 text-right">수량</div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5">단위</div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5 text-right">
              단가(VAT 포함)
            </div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5 text-right">금액</div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5">비고</div>
            <div className="whitespace-nowrap border-b border-r border-hairline px-2 py-2.5" />
          </div>

          <Reorder.Group as="div" axis="y" values={items} onReorder={onChange}>
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={(patch) => update(index, patch)}
                  onRemove={() => onChange(items.filter((_, i) => i !== index))}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>

          {items.length === 0 && (
            <p className="border-b border-r border-hairline px-2 py-6 text-center text-xs text-ink-mute">
              물품을 검색하거나 행을 추가해 견적을 작성해 주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuotationForm({
  quotation,
  members,
  products,
  businessProjects,
  onDone,
}: {
  quotation: Quotation | null;
  members: string[];
  products: ProductCatalogItem[];
  businessProjects: { id: string; title: string }[];
  onDone: () => void;
}) {
  const action = quotation ? updateQuotation : createQuotation;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [items, setItems] = useState<QuotationItem[]>(
    quotation && quotation.items.length > 0 ? quotation.items : [emptyItem()]
  );
  const [discountAmount, setDiscountAmount] = useState(quotation?.discountAmount ?? 0);
  const [extraAmount, setExtraAmount] = useState(quotation?.extraAmount ?? 0);
  const [includeStamp, setIncludeStamp] = useState(quotation?.includeStamp ?? false);
  const [executionType, setExecutionType] = useState(quotation?.executionType ?? "직영");
  const [consortiumRate, setConsortiumRate] = useState(quotation?.consortiumRate ?? 0);
  const [extraInternalCost, setExtraInternalCost] = useState(quotation?.extraInternalCost ?? 0);
  const [businessProjectId, setBusinessProjectId] = useState<string | null>(quotation?.businessProjectId ?? null);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // 품목 단가는 부가세 포함가라 품목금액 합계가 곧 품목금액이고, 공급가액·부가세는
  // 그 금액을 1.1로 나눠 거꾸로 계산한다(서버의 computeTotals와 동일한 방식). 조달
  // 수수료(product_catalog.procurement_fee_rate)는 이 계산 밖에서 최종 합계에만
  // 더해진다 — WHIZZUP 레퍼런스의 "품목금액 → 조달수수료(별도) → 최종 합계" 구조.
  const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
  const adjustedAmount = Math.max(0, subtotal - discountAmount + extraAmount);
  const supply = Math.round(adjustedAmount / 1.1);
  const tax = adjustedAmount - supply;
  const procurementFeeAmount = items.reduce((sum, it) => {
    const product = it.productId ? productById.get(it.productId) : null;
    if (!product?.procurement) return sum;
    return sum + Math.round(it.amount * ((product.procurementFeeRate ?? 0) / 100));
  }, 0);
  const total = adjustedAmount + procurementFeeAmount;

  // 내부용 수익 분석 — 제품 카탈로그에서 고른 품목만 마진율을 알 수 있어 계산에
  // 넣고, 직접 입력한 품목은 마진을 알 수 없으니 추측하지 않고 0으로 둔다.
  // 이 값들은 QuotationPrintView(인쇄용 화면)에는 애초에 전달하지 않아 밖으로
  // 나가는 문서에는 절대 노출되지 않는다(사용자 확인, 2026-08-27).
  const estimatedProfit = items.reduce((sum, it) => {
    if (!it.productId) return sum;
    const marginRate = productById.get(it.productId)?.marginRate ?? 0;
    return sum + Math.round(it.amount * (marginRate / 100));
  }, 0);
  const consortiumPayment = executionType === "컨소" ? Math.round(estimatedProfit * (consortiumRate / 100)) : 0;
  const finalProfit = estimatedProfit - consortiumPayment - extraInternalCost;
  const marginPercent = supply > 0 ? (finalProfit / supply) * 100 : 0;

  return (
    <form
      action={async (formData) => {
        formData.set("itemsJson", JSON.stringify(items));
        await formAction(formData);
        onDone();
      }}
      className="flex flex-col gap-4 lg:flex-row lg:items-start"
    >
      {quotation && <input type="hidden" name="id" value={quotation.id} />}

      <div className="min-w-0 flex-1 overflow-hidden rounded-sm border border-hairline bg-canvas-cream">
      {/* 견적서 상단 레터헤드 바 — 인쇄용 화면과 톤을 맞춰 미리보기처럼 보이게 한다 */}
      <div className="flex items-center justify-between bg-[#262b3a] px-6 py-4">
        <span className="w-24 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Quotation</span>
        <h2 className="text-center text-lg font-bold tracking-[0.5em] text-white">견 적 서</h2>
        <span className="w-24 text-right text-[10px] text-white/60">
          {quotation ? quotation.quoteNumber : "저장 시 번호 발급"}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4 pb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-start">
          {/* 견적정보 */}
          <div className="flex flex-col overflow-hidden rounded-sm border border-hairline">
            <div className="border-b border-hairline py-1.5 text-center text-[11px] font-bold tracking-[0.3em] text-[#4b5563]">
              견적정보
            </div>
            <div className="flex border-t border-hairline first:border-t-0">
              <div className="w-24 shrink-0 border-r border-hairline bg-background px-2 py-1.5 text-center text-[11px] font-medium text-ink-mute">
                견적일자
              </div>
              <input
                name="quoteDate"
                type="date"
                defaultValue={quotation?.quoteDate ?? todayStr()}
                required
                className="flex-1 border-0 bg-canvas-cream px-3 py-1.5 text-center text-[11px] font-bold text-[#4b5563] outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-24 shrink-0 border-r border-hairline bg-background px-2 py-1.5 text-center text-[11px] font-medium text-ink-mute">
                수신 기관명 *
              </div>
              <input
                name="customerName"
                defaultValue={quotation?.customerName ?? ""}
                required
                placeholder="기관명 또는 업체명"
                className="flex-1 border-0 bg-canvas-cream px-3 py-1.5 text-center text-[11px] font-bold text-[#4b5563] outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-24 shrink-0 border-r border-hairline bg-background px-2 py-1.5 text-center text-[11px] font-medium text-ink-mute">
                견적명
              </div>
              <input
                name="projectTitle"
                defaultValue={quotation?.projectTitle ?? ""}
                placeholder="예: 가상현실 스포츠실 구축"
                className="flex-1 border-0 bg-canvas-cream px-3 py-1.5 text-center text-[11px] font-bold text-[#4b5563] outline-none focus:bg-background"
              />
            </div>
            <BusinessProjectField projects={businessProjects} value={businessProjectId} onChange={setBusinessProjectId} />
            <input type="hidden" name="businessProjectId" value={businessProjectId ?? ""} />
          </div>

          {/* 공급자 (고정 정보) */}
          <div className="flex flex-col overflow-hidden rounded-sm border border-hairline">
            <div className="relative border-b border-hairline py-1.5 text-center text-[11px] font-bold tracking-[0.3em] text-[#4b5563]">
              공급자
              <label className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-[11px] font-normal tracking-normal text-ink-mute">
                <input
                  type="checkbox"
                  name="includeStamp"
                  checked={includeStamp}
                  onChange={(e) => setIncludeStamp(e.target.checked)}
                  className="h-3 w-3"
                />
                직인 포함
              </label>
            </div>
            <div className="relative">
              <InfoRow label="상호" value={QUOTATION_SUPPLIER.name} />
              <InfoRow label="사업자번호" value={QUOTATION_SUPPLIER.businessNumber} />
              <InfoRow label="대표자" value={QUOTATION_SUPPLIER.representative} />
              <InfoRow label="주소" value={QUOTATION_SUPPLIER.address} />
              <InfoRow label="전화번호" value={QUOTATION_SUPPLIER.phone} />
              <InfoSplitRow
                leftLabel="업태"
                leftValue={QUOTATION_SUPPLIER.businessType}
                rightLabel="종목"
                rightValue={QUOTATION_SUPPLIER.businessItems}
              />
              {includeStamp && (
                <span className="absolute right-3 top-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-semantic-error text-xs font-bold text-semantic-error">
                  인
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 견적금액 요약 바 — 인쇄본과 동일하게 상단에 크게 강조 */}
        <div className="flex items-center justify-between rounded-sm border border-hairline bg-background px-4 py-3">
          <span className="text-xs font-medium text-ink-mute">견적금액 (VAT 포함)</span>
          <span className="text-xl font-bold text-primary tabular-nums">{formatCurrency(total)}원</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">견적 품목 {items.length}개</span>
          <span className="text-xs text-ink-mute">제품 카탈로그에서 선택하면 품명·규격·단가가 자동으로 채워집니다.</span>
        </div>
        <ItemsEditor items={items} products={products} onChange={setItems} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-mute">
              할인 금액
              <input
                name="discountAmount"
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className={`${FIELD_CLASS} w-32`}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-mute">
              추가 금액
              <input
                name="extraAmount"
                type="number"
                min={0}
                value={extraAmount}
                onChange={(e) => setExtraAmount(Number(e.target.value) || 0)}
                className={`${FIELD_CLASS} w-32`}
              />
            </label>
          </div>
          <div className="flex flex-col divide-y divide-hairline border-y border-hairline text-xs sm:w-64">
            <div className="flex items-baseline justify-between py-1.5">
              <span className="text-ink-mute">품목금액 (VAT 포함)</span>
              <span className="font-semibold tabular-nums text-ink">{formatCurrency(adjustedAmount)}원</span>
            </div>
            <div className="flex items-baseline justify-between py-1.5">
              <span className="text-ink-mute">조달수수료 (별도)</span>
              <span className="font-semibold tabular-nums text-ink">{formatCurrency(procurementFeeAmount)}원</span>
            </div>
            <div className="flex items-baseline justify-between py-1.5">
              <span className="text-ink-mute">최종 합계</span>
              <span className="text-sm font-bold tabular-nums text-ink">{formatCurrency(total)}원</span>
            </div>
            <div className="flex items-start justify-between py-1.5">
              <div>
                <span className="text-sm font-bold text-primary">공급가액</span>
                <p className="mt-0.5 text-[10px] text-ink-mute">세액 참고 · 품목금액 기준</p>
              </div>
              <span className="text-sm font-bold tabular-nums text-primary">{formatCurrency(supply)}원</span>
            </div>
            <div className="flex items-baseline justify-between py-1.5">
              <span className="text-sm font-bold text-primary">부가세</span>
              <span className="text-sm font-bold tabular-nums text-primary">{formatCurrency(tax)}원</span>
            </div>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          특기사항 / 메모
          <textarea name="memo" defaultValue={quotation?.memo ?? ""} rows={3} className={FIELD_CLASS} />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDone}
            className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
          >
            취소
          </button>
          {quotation && (
            <Link
              href={`/dashboard/quotations/${quotation.id}/print`}
              target="_blank"
              className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
            >
              인쇄용 보기
            </Link>
          )}
        </div>
      </div>
      </div>

      {/* 영업 정보 — WHIZZUP 레퍼런스의 SALES INFO 패널. 협업 구분·내부 수익 분석은
          이 폼(화면)에만 보이고 인쇄용 화면에는 애초에 전달되지 않는다. */}
      <div className="flex w-full flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4 lg:w-72 lg:shrink-0">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Sales Info</p>
          <p className="mt-0.5 text-sm font-bold text-ink">영업 정보</p>
        </div>

        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          담당자
          <select
            name="managerName"
            defaultValue={quotation?.managerName ?? ""}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">선택</option>
            {members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          협업 구분
          <select
            name="executionType"
            value={executionType}
            onChange={(e) => setExecutionType(e.target.value as typeof executionType)}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="직영">직영</option>
            <option value="컨소">컨소</option>
            <option value="해당없음">해당없음</option>
          </select>
        </label>

        {executionType === "컨소" && (
          <>
            <label className="flex flex-col gap-1 text-xs text-ink-mute">
              컨소 업체명
              <input name="consortiumCompany" defaultValue={quotation?.consortiumCompany ?? ""} className={FIELD_CLASS} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-mute">
              컨소 지급률(%)
              <input
                name="consortiumRate"
                type="number"
                min={0}
                max={100}
                value={consortiumRate}
                onChange={(e) => setConsortiumRate(Number(e.target.value) || 0)}
                className={FIELD_CLASS}
              />
            </label>
          </>
        )}

        <div className="flex flex-col gap-1.5 rounded-sm border border-hairline bg-[#fff8ec] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink">수익 분석</span>
            <span className="rounded-full bg-[#f0dfc0] px-2 py-0.5 text-[10px] font-semibold text-[#8a5a00]">
              내부용
            </span>
          </div>
          <div className="flex justify-between text-ink-mute">
            <span>예상 수익</span>
            <span className="tabular-nums text-ink">{formatCurrency(estimatedProfit)}원</span>
          </div>
          <div className="flex justify-between text-ink-mute">
            <span>컨소 지급</span>
            <span className="tabular-nums text-ink">{formatCurrency(consortiumPayment)}원</span>
          </div>
          <label className="flex items-center justify-between text-ink-mute">
            <span>추가 내부비용</span>
            <input
              name="extraInternalCost"
              type="number"
              min={0}
              value={extraInternalCost}
              onChange={(e) => setExtraInternalCost(Number(e.target.value) || 0)}
              className="w-24 rounded-sm border border-hairline bg-canvas-cream px-1.5 py-1 text-right text-xs text-ink outline-none focus:border-primary"
            />
          </label>
          <div className="flex justify-between border-t border-hairline pt-1 font-bold text-ink">
            <span>최종 총이익</span>
            <span className="tabular-nums">{formatCurrency(finalProfit)}원</span>
          </div>
          <div className="flex justify-between text-ink-mute">
            <span>마진%</span>
            <span className="tabular-nums text-ink">{marginPercent.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-ink-mute">
            제품 카탈로그의 마진율을 기준으로 계산되며(직접 입력한 품목은 마진율을 몰라 0으로 처리),
            인쇄·PDF 화면에는 표시되지 않습니다.
          </p>
        </div>

        {state?.error && <p className="text-xs text-semantic-error">{state.error}</p>}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            name="status"
            value="draft"
            disabled={pending}
            className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-bold text-ink hover:bg-[#f7f7f8] disabled:opacity-50"
          >
            {pending ? "저장 중..." : "임시 저장"}
          </button>
          <button
            type="submit"
            name="status"
            value="final"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
          >
            {pending ? "저장 중..." : "최종 저장"}
          </button>
        </div>
      </div>
    </form>
  );
}

function QuotationCard({
  quotation,
  onEdit,
  onPrintClick,
}: {
  quotation: Quotation;
  onEdit: () => void;
  onPrintClick: (e: MouseEvent) => void;
}) {
  return (
    <div
      onClick={onEdit}
      className="flex cursor-pointer flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4 hover:border-primary sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-base font-bold text-ink">{quotation.customerName}</span>
          <span className="shrink-0 text-xs font-medium text-link-blue">{quotation.quoteNumber}</span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              quotation.status === "final"
                ? "bg-semantic-success/15 text-semantic-success"
                : "bg-[#f0f0f2] text-ink-mute"
            }`}
          >
            {quotation.status === "final" ? "최종" : "임시"}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-mute">
          {quotation.projectTitle && (
            <span className="rounded-md border border-hairline bg-background px-1.5 py-0.5 font-medium">
              {quotation.projectTitle}
            </span>
          )}
          {quotation.businessProjectTitle && (
            <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
              SI Business · {quotation.businessProjectTitle}
            </span>
          )}
          <span>견적일자 {formatDate(quotation.quoteDate)}</span>
          {quotation.managerName && <span>담당 {quotation.managerName}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
        <span className="text-xl font-bold tabular-nums text-ink">{formatCurrency(quotation.totalAmount)}원</span>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/quotations/${quotation.id}/print`}
            target="_blank"
            onClick={onPrintClick}
            className="rounded-lg border border-hairline px-3 py-1 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
          >
            인쇄
          </Link>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary-press"
          >
            견적 수정
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuotationBoard({
  quotations,
  members,
  products,
  businessProjects,
}: {
  quotations: Quotation[];
  members: string[];
  products: ProductCatalogItem[];
  businessProjects: { id: string; title: string }[];
}) {
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const [search, setSearch] = useState("");
  const editingQuotation =
    editingId && editingId !== "new" ? (quotations.find((q) => q.id === editingId) ?? null) : null;
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter(
      (item) =>
        item.customerName.toLowerCase().includes(q) ||
        (item.projectTitle ?? "").toLowerCase().includes(q) ||
        item.quoteNumber.toLowerCase().includes(q)
    );
  }, [quotations, search]);

  function handleDelete(id: string) {
    if (!window.confirm("이 견적서를 삭제할까요?")) return;
    startTransition(() => {
      void deleteQuotation(id);
    });
    setEditingId(null);
  }

  const isEditing = editingId === "new" || Boolean(editingQuotation);

  return (
    <div className="flex flex-col gap-4">
      {isEditing ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="flex w-fit items-center gap-1 text-sm font-medium text-ink-mute hover:text-ink"
          >
            ← 목록으로
          </button>
          <QuotationForm
            quotation={editingId === "new" ? null : editingQuotation}
            members={members}
            products={products}
            businessProjects={businessProjects}
            onDone={() => setEditingId(null)}
          />
          {editingQuotation && (
            <button
              type="button"
              onClick={() => handleDelete(editingQuotation.id)}
              className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
            >
              이 견적서 삭제
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-sm border border-hairline bg-canvas-cream px-4 py-2.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="기관명·사업명·견적번호 검색"
              className="flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute"
            />
            <span className="shrink-0 text-sm font-medium text-ink-mute">{filtered.length}건</span>
            <button
              type="button"
              onClick={() => setEditingId("new")}
              className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
            >
              + 새 견적 만들기
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((q) => (
              <QuotationCard
                key={q.id}
                quotation={q}
                onEdit={() => setEditingId(q.id)}
                onPrintClick={(e) => e.stopPropagation()}
              />
            ))}
            {filtered.length === 0 && (
              <p className="rounded-sm border border-hairline bg-canvas-cream p-6 text-center text-sm text-ink-mute">
                {quotations.length === 0 ? "등록된 견적서가 없습니다." : "검색 결과가 없습니다."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
