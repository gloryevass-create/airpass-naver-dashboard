"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import type { Quotation, QuotationItem } from "@/lib/queries/quotations";
import type { ProductCatalogItem } from "@/lib/queries/productCatalog";
import { createQuotation, updateQuotation, deleteQuotation } from "@/app/dashboard/actions/quotations";

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
  "rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary";
const CELL_FIELD_CLASS =
  "w-full rounded-sm border border-hairline bg-canvas-cream px-1.5 py-1 text-xs text-ink outline-none focus:border-primary";

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

  const subtotal = items.reduce((sum, it) => sum + it.amount, 0);

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
                <td colSpan={8} className="px-2 py-4 text-center text-xs text-ink-mute">
                  품목을 추가하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem()])}
          className="w-fit rounded-lg border border-hairline px-3 py-1 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
        >
          + 품목 추가
        </button>
        <span className="text-xs text-ink-mute">품목 합계 {formatCurrency(subtotal)}원</span>
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
      className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4"
    >
      {quotation && <input type="hidden" name="id" value={quotation.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          고객사/발주기관 *
          <input name="customerName" defaultValue={quotation?.customerName ?? ""} required className={FIELD_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          프로젝트명
          <input name="projectTitle" defaultValue={quotation?.projectTitle ?? ""} className={FIELD_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          견적일자
          <input
            name="quoteDate"
            type="date"
            defaultValue={quotation?.quoteDate ?? todayStr()}
            required
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          유효기간
          <input name="validUntil" type="date" defaultValue={quotation?.validUntil ?? ""} className={FIELD_CLASS} />
        </label>
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
        <label className="flex items-center gap-2 text-xs text-ink-mute">
          <input
            type="checkbox"
            name="includeStamp"
            defaultChecked={quotation?.includeStamp ?? false}
            className="h-3.5 w-3.5"
          />
          직인(도장) 포함
        </label>
      </div>

      <ItemsEditor items={items} products={products} onChange={setItems} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          할인 금액
          <input
            name="discountAmount"
            type="number"
            min={0}
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
            className={FIELD_CLASS}
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
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <div className="flex flex-col items-end gap-1 rounded-sm border border-hairline bg-background p-3 text-sm">
        <div className="flex w-56 justify-between text-ink-mute">
          <span>공급가액</span>
          <span className="tabular-nums">{formatCurrency(supply)}원</span>
        </div>
        <div className="flex w-56 justify-between text-ink-mute">
          <span>부가세(10%)</span>
          <span className="tabular-nums">{formatCurrency(tax)}원</span>
        </div>
        <div className="flex w-56 justify-between font-bold text-ink">
          <span>합계</span>
          <span className="tabular-nums">{formatCurrency(total)}원</span>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs text-ink-mute">
        비고
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
    </form>
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
  const editingQuotation =
    editingId && editingId !== "new" ? (quotations.find((q) => q.id === editingId) ?? null) : null;
  const [, startTransition] = useTransition();

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
        <div className="flex flex-col gap-4 rounded-sm border border-hairline bg-canvas-cream p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">전체 {quotations.length}건</span>
            <button
              type="button"
              onClick={() => setEditingId("new")}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
            >
              + 새 견적서 작성
            </button>
          </div>
          <div className="overflow-x-auto rounded-sm border border-hairline bg-background">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-ink-mute">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">견적번호</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">고객사</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">프로젝트명</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-right">합계금액</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">견적일자</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setEditingId(q.id)}
                    className="cursor-pointer border-t border-hairline hover:bg-[#f7f7f8]"
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-link-blue">{q.quoteNumber}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink">{q.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{q.projectTitle || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-ink">
                      {formatCurrency(q.totalAmount)}원
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{formatDate(q.quoteDate)}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <Link
                        href={`/dashboard/quotations/${q.id}/print`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-link-blue hover:underline"
                      >
                        인쇄
                      </Link>
                    </td>
                  </tr>
                ))}
                {quotations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-ink-mute">
                      등록된 견적서가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
