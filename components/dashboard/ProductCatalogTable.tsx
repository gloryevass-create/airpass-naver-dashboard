"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductCatalogItem } from "@/lib/queries/productCatalog";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  bulkAssignVendor,
  toggleProductFavorite,
  moveProductInUserOrder,
  type BulkImportRow,
} from "@/app/dashboard/actions/productCatalog";
import {
  createProductCatalogWorkbook,
  parseProductCatalogWorkbook,
  type ProductCatalogImportRow,
} from "@/lib/productCatalogXlsx";

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

function downloadWorkbook(items: ProductCatalogItem[], filename: string) {
  const bytes = createProductCatalogWorkbook(items).slice();
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
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
      className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4"
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
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "저장 중..." : product ? "수정 저장" : "제품 추가"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function ImportPreview({
  rows,
  onCancel,
  onImported,
}: {
  rows: ProductCatalogImportRow[];
  onCancel: () => void;
  onImported: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const valid = rows.filter((r) => r.errors.length === 0);
  const invalid = rows.filter((r) => r.errors.length > 0);

  function handleImport() {
    const payload: BulkImportRow[] = valid.map((r) => ({
      name: r.name,
      specification: r.specification,
      unitPrice: r.unitPrice,
      note: r.note,
      supplyType: r.supplyType,
      commissionRate: r.commissionRate,
      marginRate: r.marginRate,
      reference: r.reference,
    }));
    startTransition(async () => {
      const result = await bulkImportProducts(payload);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      onImported();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4">
      <p className="text-sm text-ink">
        총 {rows.length}행 중 <strong className="text-primary">{valid.length}건 가져오기 가능</strong>
        {invalid.length > 0 && <span className="text-semantic-error"> · {invalid.length}건 오류(제외됨)</span>}
      </p>
      {invalid.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-hairline bg-background p-2 text-xs text-semantic-error">
          {invalid.map((r) => (
            <p key={r.rowNumber}>
              {r.rowNumber}행 ({r.name || "이름 없음"}): {r.errors.join(", ")}
            </p>
          ))}
        </div>
      )}
      {message && <p className="text-sm text-semantic-error">{message}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleImport}
          disabled={pending || valid.length === 0}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "가져오는 중..." : `${valid.length}건 가져오기`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export function ProductCatalogTable({
  products,
  vendors,
}: {
  products: ProductCatalogItem[];
  vendors: { id: string; companyName: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [editing, setEditing] = useState<ProductCatalogItem | null | "new">(null);
  const [importRows, setImportRows] = useState<ProductCatalogImportRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkVendorId, setBulkVendorId] = useState<string>("__choose__");
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const favoriteCount = useMemo(() => products.filter((p) => p.isFavorite).length, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (favoritesOnly) list = list.filter((p) => p.isFavorite);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.specification ?? "").toLowerCase().includes(q) ||
          (p.note ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, favoritesOnly]);

  // 화살표 순서 변경은 전체 116건 기준 순서를 바꾸는데, 검색·즐겨찾기 필터가 걸려 있으면
  // 맞바뀔 상대가 화면에 안 보여서 "눌러도 아무 반응 없는 것처럼" 보인다 — 필터가 없을
  // 때만 허용한다.
  const canReorder = !search.trim() && !favoritesOnly;

  function handleToggleFavorite(id: string) {
    startTransition(async () => {
      await toggleProductFavorite(id);
      router.refresh();
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveProductInUserOrder(id, direction);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("이 제품을 삭제할까요?")) return;
    startTransition(() => {
      void deleteProduct(id);
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id))));
  }

  function handleBulkAssign() {
    if (bulkVendorId === "__choose__" || selected.size === 0) return;
    const vendorId = bulkVendorId === "__none__" ? null : bulkVendorId;
    startTransition(() => {
      void bulkAssignVendor(Array.from(selected), vendorId);
    });
    setSelected(new Set());
    setBulkVendorId("__choose__");
  }

  async function handleFileSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    try {
      const rows = parseProductCatalogWorkbook(await file.arrayBuffer());
      setImportRows(rows);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "엑셀 파일을 읽지 못했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {importRows && (
        <ImportPreview
          rows={importRows}
          onCancel={() => setImportRows(null)}
          onImported={() => setImportRows(null)}
        />
      )}
      {editing === "new" && <ProductForm product={null} onDone={() => setEditing(null)} />}
      {editing && editing !== "new" && <ProductForm product={editing} onDone={() => setEditing(null)} />}

      <div className="flex flex-col overflow-hidden rounded-sm border border-hairline bg-canvas-cream">
        <div className="flex flex-wrap items-center gap-3 p-4 text-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명·규격·비고 검색"
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-ink outline-none focus:border-primary"
          />
          <span className="text-xs text-ink-mute">
            전체 <strong className="text-ink">{products.length.toLocaleString("ko-KR")}</strong>건 중{" "}
            <strong className="text-ink">{filtered.length.toLocaleString("ko-KR")}</strong>건 표시 중입니다.
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsv(products)}
              className="flex items-center gap-1.5 rounded-lg border border-hairline bg-background px-4 py-1.5 text-xs font-bold text-ink hover:bg-[#f7f7f8]"
            >
              CSV 다운로드
            </button>
            <button
              type="button"
              onClick={() => downloadWorkbook([], "제품카탈로그_양식.xlsx")}
              className="flex items-center gap-1.5 rounded-lg border border-hairline bg-background px-4 py-1.5 text-xs font-bold text-ink hover:bg-[#f7f7f8]"
            >
              엑셀 양식 다운로드
            </button>
            <button
              type="button"
              onClick={() => downloadWorkbook(products, `제품카탈로그_${new Date().toISOString().slice(0, 10)}.xlsx`)}
              className="flex items-center gap-1.5 rounded-lg border border-hairline bg-background px-4 py-1.5 text-xs font-bold text-ink hover:bg-[#f7f7f8]"
            >
              엑셀 내보내기
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-hairline bg-background px-4 py-1.5 text-xs font-bold text-ink hover:bg-[#f7f7f8]"
            >
              엑셀로 가져오기
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => void handleFileSelected(e.target.files)}
              hidden
            />
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
            >
              + 새 제품 추가
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-4 py-2 text-xs">
          <button
            type="button"
            onClick={() => setFavoritesOnly(false)}
            className={`rounded-lg px-3 py-1 font-bold transition-colors ${
              !favoritesOnly ? "bg-primary text-white" : "bg-background text-ink-mute hover:text-ink"
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`rounded-lg px-3 py-1 font-bold transition-colors ${
              favoritesOnly ? "bg-primary text-white" : "bg-background text-ink-mute hover:text-ink"
            }`}
          >
            ★ 즐겨찾기 {favoriteCount.toLocaleString("ko-KR")}
          </button>
        </div>

        <div
          className={`flex flex-wrap items-center gap-3 border-t p-3 text-xs transition-colors ${
            selected.size > 0 ? "border-primary/30 bg-canvas-lavender/30" : "border-hairline"
          }`}
        >
          <label className="flex items-center gap-1.5 text-ink-mute">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={toggleSelectAll}
            />
            현재 목록 전체 선택
          </label>
          <span className="rounded-full bg-background px-2.5 py-1 font-semibold text-ink">
            {selected.size.toLocaleString("ko-KR")}개 선택됨
          </span>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={bulkVendorId}
              onChange={(e) => setBulkVendorId(e.target.value)}
              disabled={selected.size === 0}
              className="rounded-sm border border-hairline bg-background px-2 py-1.5 text-ink disabled:opacity-50"
            >
              <option value="__choose__">공급 협력사 선택</option>
              <option value="__none__">협력사 연결 해제</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.companyName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={selected.size === 0 || bulkVendorId === "__choose__"}
              className="rounded-lg bg-primary px-4 py-1.5 font-bold text-white hover:bg-primary-press disabled:opacity-50"
            >
              선택 제품 일괄 적용
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-auto border-t border-hairline">
          <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-[#f7f7f8] text-left text-ink-mute">
            <tr>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">선택·품명</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">규격</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">단가</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">공급방식</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">협력사</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">수수료/마진율</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">조달정보</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">비고</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, index) => {
              const reorderDisabledReason = !canReorder
                ? "정렬 순서 변경은 검색어·즐겨찾기 필터 없이 전체 보기에서만 가능합니다."
                : null;
              const canMoveUp = canReorder && index > 0;
              const canMoveDown = canReorder && index < filtered.length - 1;
              return (
              <tr
                key={p.id}
                className="border-t border-hairline odd:bg-white even:bg-[#f7f7f8] hover:bg-canvas-lavender/20"
              >
                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-ink">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(p.id)}
                      title="즐겨찾기"
                      className={p.isFavorite ? "text-[#f5a623]" : "text-ink-mute/50 hover:text-ink-mute"}
                    >
                      {p.isFavorite ? "★" : "☆"}
                    </button>
                    <div className="flex flex-col leading-none">
                      <button
                        type="button"
                        onClick={() => handleMove(p.id, "up")}
                        disabled={!canMoveUp}
                        title={reorderDisabledReason ?? "위로"}
                        className="text-ink-mute hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(p.id, "down")}
                        disabled={!canMoveDown}
                        title={reorderDisabledReason ?? "아래로"}
                        className="text-ink-mute hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    {p.needsReview && <span className="text-semantic-error">!</span>}
                    <span>{p.name}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-ink-mute">{p.specification ?? "-"}</td>
                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-ink">{formatWon(p.unitPrice)}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-ink-mute">
                  {p.supplyType === "partner" ? "협력사" : "직공급"}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-ink-mute">
                  {p.supplyType === "partner" ? (p.supplierVendorName ?? "-") : "-"}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5">
                  {(p.supplyType === "partner" ? p.commissionRate : p.marginRate) != null ? (
                    <span className="rounded-full bg-canvas-lavender px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {formatRate(p.supplyType === "partner" ? p.commissionRate : p.marginRate)}
                    </span>
                  ) : (
                    <span className="text-ink-mute">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5">
                  {p.procurement ? (
                    <span className="rounded-full bg-canvas-cream px-2 py-0.5 text-[11px] font-medium text-ink-mute">
                      {`${p.procurementChannel ?? ""} ${p.procurementNumber ?? ""}`.trim()}
                    </span>
                  ) : (
                    <span className="text-ink-mute">-</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-ink-mute">{p.note ?? "-"}</td>
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
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-ink-mute">
                  조건에 맞는 제품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
