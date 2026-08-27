"use client";

import { useActionState, useMemo, useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
import type { Quotation, QuotationItem } from "@/lib/queries/quotations";
import type { ProductCatalogItem } from "@/lib/queries/productCatalog";
import { createQuotation, updateQuotation, deleteQuotation } from "@/app/dashboard/actions/quotations";
import { QUOTATION_SUPPLIER } from "@/lib/quotationCompany";

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
  return { productId: null, name: "", specification: "", unit: "EA", quantity: 1, unitPrice: 0, amount: 0 };
}

const FIELD_CLASS =
  "rounded-sm border border-hairline bg-canvas-cream px-3 py-1.5 text-sm text-ink outline-none focus:border-primary";
const CELL_FIELD_CLASS =
  "w-full rounded-sm border border-hairline bg-canvas-cream px-1.5 py-1 text-xs text-ink outline-none focus:border-primary";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-t border-hairline first:border-t-0">
      <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">{label}</div>
      <div className="flex-1 px-3 py-2 text-xs text-ink">{value}</div>
    </div>
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
  function update(index: number, patch: Partial<QuotationItem>) {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    next[index] = { ...next[index], amount: Math.round(next[index].quantity * next[index].unitPrice) };
    onChange(next);
  }

  function pickProduct(index: number, productId: string) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;
    update(index, {
      productId: p.id,
      name: p.name,
      specification: p.specification ?? "",
      unitPrice: p.unitPrice ?? 0,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-sm border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-ink-mute">
            <tr>
              <th className="whitespace-nowrap px-2 py-2 font-medium">제품(선택)</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium">품명 *</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium">규격</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium">단위</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium text-right">수량</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium text-right">단가</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium text-right">금액</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t border-hairline">
                <td className="min-w-32 px-2 py-1.5">
                  <select
                    value={item.productId ?? ""}
                    onChange={(e) => e.target.value && pickProduct(index, e.target.value)}
                    className={CELL_FIELD_CLASS}
                  >
                    <option value="">직접입력</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="min-w-28 px-2 py-1.5">
                  <input
                    value={item.name}
                    onChange={(e) => update(index, { name: e.target.value })}
                    className={CELL_FIELD_CLASS}
                  />
                </td>
                <td className="min-w-24 px-2 py-1.5">
                  <input
                    value={item.specification}
                    onChange={(e) => update(index, { specification: e.target.value })}
                    className={CELL_FIELD_CLASS}
                  />
                </td>
                <td className="w-16 px-2 py-1.5">
                  <input
                    value={item.unit}
                    onChange={(e) => update(index, { unit: e.target.value })}
                    className={CELL_FIELD_CLASS}
                  />
                </td>
                <td className="w-20 px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => update(index, { quantity: Number(e.target.value) || 0 })}
                    className={`${CELL_FIELD_CLASS} text-right`}
                  />
                </td>
                <td className="w-28 px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => update(index, { unitPrice: Number(e.target.value) || 0 })}
                    className={`${CELL_FIELD_CLASS} text-right`}
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right text-xs tabular-nums text-ink">
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    className="text-xs text-semantic-error hover:underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-xs text-ink-mute">
                  물품을 검색하거나 행을 추가해 견적을 작성해 주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, emptyItem()])}
        className="w-fit self-center rounded-full border border-dashed border-hairline px-4 py-1 text-xs font-medium text-ink-mute hover:border-primary hover:text-primary"
      >
        + 품목 추가
      </button>
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

  const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
  const supply = Math.max(0, subtotal - discountAmount + extraAmount);
  const tax = Math.round(supply * 0.1);
  const total = supply + tax;

  return (
    <form
      action={async (formData) => {
        formData.set("itemsJson", JSON.stringify(items));
        await formAction(formData);
        onDone();
      }}
      className="flex flex-col gap-4 overflow-hidden rounded-sm border border-hairline bg-canvas-cream"
    >
      {quotation && <input type="hidden" name="id" value={quotation.id} />}

      {/* 견적서 상단 레터헤드 바 — 인쇄용 화면과 톤을 맞춰 미리보기처럼 보이게 한다 */}
      <div className="flex items-center justify-between bg-[#262b3a] px-6 py-4">
        <span className="w-24 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Quotation</span>
        <h2 className="text-center text-lg font-bold tracking-[0.5em] text-white">견 적 서</h2>
        <span className="w-24 text-right text-[10px] text-white/60">
          {quotation ? quotation.quoteNumber : "저장 시 번호 발급"}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="grid grid-cols-1 overflow-hidden rounded-sm border border-hairline sm:grid-cols-2">
          {/* 견적정보 */}
          <div className="flex flex-col">
            <div className="bg-background px-3 py-2 text-xs font-bold text-ink">견적정보</div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">견적일자</div>
              <input
                name="quoteDate"
                type="date"
                defaultValue={quotation?.quoteDate ?? todayStr()}
                required
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs text-ink outline-none focus:bg-background"
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
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs text-ink outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">견적명</div>
              <input
                name="projectTitle"
                defaultValue={quotation?.projectTitle ?? ""}
                placeholder="예: 가상현실 스포츠실 구축"
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs text-ink outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">유효기간</div>
              <input
                name="validUntil"
                type="date"
                defaultValue={quotation?.validUntil ?? ""}
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs text-ink outline-none focus:bg-background"
              />
            </div>
            <div className="flex border-t border-hairline">
              <div className="w-20 shrink-0 bg-background px-3 py-2 text-xs font-medium text-ink-mute">담당자</div>
              <select
                name="managerName"
                defaultValue={quotation?.managerName ?? ""}
                className="flex-1 border-0 bg-canvas-cream px-3 py-2 text-xs text-ink outline-none focus:bg-background"
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
          <div className="flex flex-col border-t border-hairline sm:border-l sm:border-t-0">
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

        {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
          >
            {pending ? "저장 중..." : quotation ? "수정 저장" : "견적서 작성"}
          </button>
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
