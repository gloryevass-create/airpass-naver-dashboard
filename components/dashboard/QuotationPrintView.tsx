"use client";

import type { Quotation } from "@/lib/queries/quotations";
import { QUOTATION_SUPPLIER } from "@/lib/quotationCompany";

function formatCurrency(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function QuotationPrintView({ quotation }: { quotation: Quotation }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div className="flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          인쇄하기
        </button>
      </div>

      <div className="rounded-sm border border-hairline bg-white p-10 text-ink shadow-sm print:border-0 print:p-0 print:shadow-none">
        <h1 className="text-center text-2xl font-bold tracking-[0.4em]">견 적 서</h1>

        <div className="mt-8 flex flex-wrap justify-between gap-4 text-sm">
          <div>
            <p className="font-medium">수신: {quotation.customerName} 귀중</p>
            {quotation.projectTitle && <p className="mt-1 text-ink-mute">건명: {quotation.projectTitle}</p>}
          </div>
          <div className="text-right text-ink-mute">
            <p>견적번호 {quotation.quoteNumber}</p>
            <p>견적일자 {formatDate(quotation.quoteDate)}</p>
            {quotation.validUntil && <p>유효기간 {formatDate(quotation.validUntil)}까지</p>}
          </div>
        </div>

        <p className="mt-6 text-sm text-ink-mute">아래와 같이 견적합니다.</p>
        <p className="mt-1 text-xl font-bold">
          합계금액 : 일금 {formatCurrency(quotation.totalAmount)}원整 (VAT 포함)
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-y-2 border-ink bg-[#f5f5f7]">
                <th className="border border-hairline px-2 py-1.5">품명</th>
                <th className="border border-hairline px-2 py-1.5">규격</th>
                <th className="border border-hairline px-2 py-1.5">단위</th>
                <th className="border border-hairline px-2 py-1.5">수량</th>
                <th className="border border-hairline px-2 py-1.5">단가</th>
                <th className="border border-hairline px-2 py-1.5">금액</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, i) => (
                <tr key={i}>
                  <td className="border border-hairline px-2 py-1.5">{item.name}</td>
                  <td className="border border-hairline px-2 py-1.5">{item.specification}</td>
                  <td className="border border-hairline px-2 py-1.5 text-center">{item.unit}</td>
                  <td className="border border-hairline px-2 py-1.5 text-right tabular-nums">
                    {item.quantity.toLocaleString("ko-KR")}
                  </td>
                  <td className="border border-hairline px-2 py-1.5 text-right tabular-nums">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border border-hairline px-2 py-1.5 text-right tabular-nums">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="flex w-64 flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-mute">공급가액</span>
              <span className="tabular-nums">{formatCurrency(quotation.supplyAmount)}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-mute">부가세(10%)</span>
              <span className="tabular-nums">{formatCurrency(quotation.taxAmount)}원</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1 font-bold">
              <span>합계</span>
              <span className="tabular-nums">{formatCurrency(quotation.totalAmount)}원</span>
            </div>
          </div>
        </div>

        {quotation.memo && <p className="mt-6 whitespace-pre-wrap text-sm text-ink-mute">{quotation.memo}</p>}

        <div className="mt-10 flex flex-wrap items-start justify-between gap-4 border-t border-hairline pt-6 text-sm">
          <div>
            <p className="flex items-center gap-2 font-bold">
              {QUOTATION_SUPPLIER.name}
              {quotation.includeStamp && (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-semantic-error text-xs font-bold text-semantic-error">
                  인
                </span>
              )}
            </p>
            <p className="mt-1 text-ink-mute">사업자등록번호 {QUOTATION_SUPPLIER.businessNumber}</p>
            <p className="text-ink-mute">대표자 {QUOTATION_SUPPLIER.representative}</p>
            <p className="text-ink-mute">{QUOTATION_SUPPLIER.address}</p>
            <p className="text-ink-mute">
              {QUOTATION_SUPPLIER.businessType} · {QUOTATION_SUPPLIER.businessItems}
            </p>
            <p className="text-ink-mute">TEL {QUOTATION_SUPPLIER.phone}</p>
          </div>
          {quotation.managerName && <p className="text-ink-mute">담당자 {quotation.managerName}</p>}
        </div>
      </div>
    </div>
  );
}
