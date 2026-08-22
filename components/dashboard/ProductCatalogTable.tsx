"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import type { ProductCatalogItem } from "@/lib/queries/productCatalog";
import { createProduct, updateProduct, deleteProduct } from "@/app/dashboard/actions/productCatalog";

function formatWon(value: number | null): string {
  if (value == null) return "-";
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatRate(value: number | null): string {
  if (value == null) return "-";
  return `${Math.round(value * 1000) / 10}%`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(products: ProductCatalogItem[]) {
  const header = ["제품명", "규격", "단가", "공급방식", "수수료/마진율", "조달채널", "조달식별번호", "비고"].join(",");
  const rows = products.map((p) =>
    [
      p.name,
      p.specification ?? "",
      p.unitPrice != null ? String(p.unitPrice) : "",
      p.supplyType === "partner" ? "협력사" : "직공급",
      p.supplyType === "partner" ? formatRate(p.commissionRate) : formatRate(p.marginRate),
      p.procurementChannel ?? "",
      p.procurementNumber ?? "",
      p.note ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `제품카탈로그_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ProductForm({
  product,
  onDone,
}: {
  product: ProductCatalogItem | null;
  onDone: () => void;
}) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [supplyType, setSupplyType] = useState<"partner" | "direct">(product?.supplyType ?? "partner");

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-xl border border-hairline bg-canvas-cream p-4"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          제품명 *
          <input
            name="name"
            defaultValue={product?.name ?? ""}
            required
            className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          규격
          <input
            name="specification"
            defaultValue={product?.specification ?? ""}
            className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          단가(원)
          <input
            name="unitPrice"
            type="number"
            defaultValue={product?.unitPrice ?? ""}
            className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          공급방식
          <select
            name="supplyType"
            value={supplyType}
            onChange={(e) => setSupplyType(e.target.value as "partner" | "direct")}
            className="rounded-md border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="partner">협력사 공급 (수수료율)</option>
            <option value="direct">직공급 (마진율)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          {supplyType === "partner" ? "수수료율(%)" : "마진율(%)"}
          <input
            name="rate"
            type="number"
            step="0.1"
            defaultValue={
              product
                ? ((supplyType === "partner" ? product.commissionRate : product.marginRate) ?? 0) * 100 || ""
                : ""
            }
            className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          참고 링크
          <input
            name="reference"
            defaultValue={product?.reference ?? ""}
            className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          비고 (G2B/S2B 등 조달 식별번호가 포함돼 있으면 자동으로 채널·번호를 인식합니다)
          <input
            name="note"
            defaultValue={product?.note ?? ""}
            placeholder="예: ㈜에어패스 G2B : 24563902"
            className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
      </div>
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "저장 중..." : product ? "수정 저장" : "제품 추가"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-canvas-cream"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export function ProductCatalogTable({ products }: { products: ProductCatalogItem[] }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProductCatalogItem | null | "new">(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.specification ?? "").toLowerCase().includes(q) ||
        (p.note ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  function handleDelete(id: string) {
    if (!window.confirm("이 제품을 삭제할까요?")) return;
    startTransition(() => {
      void deleteProduct(id);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제품명·규격·비고 검색"
          className="rounded-md border border-hairline px-3 py-1.5 text-ink outline-none focus:border-primary"
        />
        <span className="text-xs font-bold text-ink-mute">
          전체 {products.length.toLocaleString("ko-KR")}건 중 {filtered.length.toLocaleString("ko-KR")}건 표시
        </span>
        <button
          type="button"
          onClick={() => downloadCsv(products)}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-hairline px-4 py-1.5 text-xs font-bold text-ink hover:bg-canvas-cream"
        >
          CSV 다운로드
        </button>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          + 새 제품 추가
        </button>
      </div>

      {editing === "new" && <ProductForm product={null} onDone={() => setEditing(null)} />}
      {editing && editing !== "new" && <ProductForm product={editing} onDone={() => setEditing(null)} />}

      <div className="overflow-auto rounded-sm border border-hairline">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#f7f7f8] text-left text-ink-mute">
            <tr>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">제품명</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">규격</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">단가</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">공급방식</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">수수료/마진율</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">조달정보</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">비고</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-hairline odd:bg-white even:bg-[#f7f7f8]">
                <td className="whitespace-nowrap px-2 py-1 font-medium text-ink">
                  {p.needsReview && <span className="mr-1 text-semantic-error">!</span>}
                  {p.name}
                </td>
                <td className="px-2 py-1 text-ink-mute">{p.specification ?? "-"}</td>
                <td className="whitespace-nowrap px-2 py-1 text-ink-mute">{formatWon(p.unitPrice)}</td>
                <td className="whitespace-nowrap px-2 py-1 text-ink-mute">
                  {p.supplyType === "partner" ? "협력사" : "직공급"}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-ink-mute">
                  {formatRate(p.supplyType === "partner" ? p.commissionRate : p.marginRate)}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-ink-mute">
                  {p.procurement ? `${p.procurementChannel ?? ""} ${p.procurementNumber ?? ""}`.trim() : "-"}
                </td>
                <td className="px-2 py-1 text-ink-mute">{p.note ?? "-"}</td>
                <td className="whitespace-nowrap px-2 py-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="text-link-blue hover:underline"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-semantic-error hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-mute">
                  조건에 맞는 제품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
