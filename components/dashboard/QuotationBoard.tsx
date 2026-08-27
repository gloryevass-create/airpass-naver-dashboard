"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
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
  return { productId: null, name: "", specification: "", unit: "EA", quantity: 1, unitPrice: 0, amount: 0, note: "" };
}

const FIELD_CLASS =
  "rounded-sm border border-hairline bg-canvas-cream px-3 py-1.5 text-sm text-ink outline-none focus:border-primary";
// 표 안의 입력칸은 평소엔 일반 표 텍스트처럼 보이다가(테두리 없음) 포커스했을 때만
// 입력 중임을 보여준다 — 편집 가능한 셀이라는 걸 알 수 있으면서도 표가 입력창들로
// 빽빽해 보이지 않게 한다(레퍼런스 디자인 참고, 2026-08-27).
const CELL_FIELD_CLASS =
  "w-full rounded-sm border border-transparent bg-transparent px-1.5 py-1 text-xs text-ink outline-none focus:border-hairline focus:bg-canvas-cream";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-t border-hairline first:border-t-0">
      <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">{label}</div>
      <div className="flex-1 px-3 py-2 text-xs font-bold text-ink">{value}</div>
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
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-y-auto rounded-sm border border-hairline bg-canvas-cream shadow-lg">
            <div className="sticky top-0 flex items-center gap-2 border-b border-hairline bg-canvas-cream px-4 py-3">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="물품명·규격으로 검색"
                className="min-w-0 flex-1 rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
              />
              <span className="hidden shrink-0 text-xs text-ink-mute sm:inline">물품을 연속으로 선택할 수 있습니다.</span>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
              >
                선택 완료
              </button>
            </div>
            {filteredProducts.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-ink-mute">검색 결과가 없습니다.</p>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className={`flex w-full items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-left first:border-t-0 hover:bg-canvas-lavender/30 ${
                    justAddedId === p.id ? "border-2 border-primary" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">
                      {p.isFavorite && <span className="mr-1 text-primary">★</span>}
                      {p.name}
                    </span>
                    {p.specification && <span className="block truncate text-xs text-ink-mute">{p.specification}</span>}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                    {p.unitPrice != null ? `${formatCurrency(p.unitPrice)}원` : "-"}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-sm border border-hairline">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-background text-left text-ink-mute">
            <tr>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium">No</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium">품명 *</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium">규격</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium text-right">수량</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium">단위</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium text-right">단가(VAT 포함)</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium text-right">금액</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium">비고</th>
              <th className="whitespace-nowrap border border-hairline px-2 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="border border-hairline px-2 py-1.5 text-center text-xs text-ink-mute">{index + 1}</td>
                <td className="min-w-28 border border-hairline px-2 py-1.5">
                  <input
                    value={item.name}
                    onChange={(e) => update(index, { name: e.target.value })}
                    className={CELL_FIELD_CLASS}
                  />
                </td>
                <td className="min-w-24 border border-hairline px-2 py-1.5">
                  <input
                    value={item.specification}
                    onChange={(e) => update(index, { specification: e.target.value })}
                    className={CELL_FIELD_CLASS}
                  />
                </td>
                <td className="w-20 border border-hairline px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => update(index, { quantity: Number(e.target.value) || 0 })}
                    className={`${CELL_FIELD_CLASS} text-right`}
                  />
                </td>
                <td className="w-16 border border-hairline px-2 py-1.5">
                  <input
                    value={item.unit}
                    onChange={(e) => update(index, { unit: e.target.value })}
                    className={`${CELL_FIELD_CLASS} text-center`}
                  />
                </td>
                <td className="w-28 border border-hairline px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => update(index, { unitPrice: Number(e.target.value) || 0 })}
                    className={`${CELL_FIELD_CLASS} text-right`}
                  />
                </td>
                <td className="whitespace-nowrap border border-hairline px-2 py-1.5 text-right text-xs font-bold tabular-nums text-ink">
                  {formatCurrency(item.amount)}
                </td>
                <td className="min-w-24 border border-hairline px-2 py-1.5">
                  <input
                    value={item.note}
                    onChange={(e) => update(index, { note: e.target.value })}
                    className={CELL_FIELD_CLASS}
                  />
                </td>
                <td className="border border-hairline px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    aria-label="품목 삭제"
                    className="text-semantic-error hover:opacity-70"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="border border-hairline px-2 py-6 text-center text-xs text-ink-mute">
                  물품을 검색하거나 행을 추가해 견적을 작성해 주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuotationForm({
  quotation,
  members,
  products,
  onDone,
}: {
  quotation: Quotation | null;
  members: string[];
  products: ProductCatalogItem[];
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

  // 품목 단가는 부가세 포함가라 품목금액 합계가 곧 최종 합계이고, 공급가액·부가세는
  // 그 합계를 1.1로 나눠 거꾸로 계산한다(서버의 computeTotals와 동일한 방식).
  const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
  const total = Math.max(0, subtotal - discountAmount + extraAmount);
  const supply = Math.round(total / 1.1);
  const tax = total - supply;

  // 내부용 수익 분석 — 제품 카탈로그에서 고른 품목만 마진율을 알 수 있어 계산에
  // 넣고, 직접 입력한 품목은 마진을 알 수 없으니 추측하지 않고 0으로 둔다.
  // 이 값들은 QuotationPrintView(인쇄용 화면)에는 애초에 전달하지 않아 밖으로
  // 나가는 문서에는 절대 노출되지 않는다(사용자 확인, 2026-08-27).
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
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
            <div className="bg-background px-3 py-2 text-xs font-bold text-ink">견적정보</div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">견적일자</div>
              <input
                name="quoteDate"
                type="date"
                defaultValue={quotation?.quoteDate ?? todayStr()}
                required
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">
                수신 기관명 *
              </div>
              <input
                name="customerName"
                defaultValue={quotation?.customerName ?? ""}
                required
                placeholder="기관명 또는 업체명"
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">견적명</div>
              <input
                name="projectTitle"
                defaultValue={quotation?.projectTitle ?? ""}
                placeholder="예: 가상현실 스포츠실 구축"
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">유효기간</div>
              <input
                name="validUntil"
                type="date"
                defaultValue={quotation?.validUntil ?? ""}
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">담당자</div>
              <select
                name="managerName"
                defaultValue={quotation?.managerName ?? ""}
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:bg-background"
              >
                <option value="">선택</option>
                {members.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 공급자 (고정 정보) */}
          <div className="flex flex-col overflow-hidden rounded-sm border border-hairline">
            <div className="flex items-center justify-between bg-background px-3 py-2">
              <span className="text-xs font-bold text-ink">공급자</span>
              <label className="flex items-center gap-1.5 text-[11px] text-ink-mute">
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
              <InfoRow label="업태" value={QUOTATION_SUPPLIER.businessType} />
              <InfoRow label="종목" value={QUOTATION_SUPPLIER.businessItems} />
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
          <div className="flex flex-col gap-1 rounded-sm border border-hairline bg-background p-3 text-sm sm:w-64">
            <div className="flex justify-between text-ink-mute">
              <span>공급가액</span>
              <span className="tabular-nums">{formatCurrency(supply)}원</span>
            </div>
            <div className="flex justify-between text-ink-mute">
              <span>부가세(10%)</span>
              <span className="tabular-nums">{formatCurrency(tax)}원</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1 font-bold text-ink">
              <span>최종 합계</span>
              <span className="tabular-nums">{formatCurrency(total)}원</span>
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
}: {
  quotations: Quotation[];
  members: string[];
  products: ProductCatalogItem[];
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
