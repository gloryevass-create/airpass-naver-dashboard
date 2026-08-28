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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-t border-hairline first:border-t-0">
      <div className="w-24 shrink-0 bg-[#f5f5f7] px-3 py-2 text-xs font-medium text-ink-mute print:bg-[#f5f5f7]">
        {label}
      </div>
      <div className="flex-1 px-3 py-2 text-xs font-bold text-ink">{value}</div>
    </div>
  );
}

export function QuotationPrintView({
  quotation,
  showDownloadButton = false,
}: {
  quotation: Quotation;
  /** 고객 공유용 공개 페이지(app/quote/[id])에서만 "PDF 다운로드" 버튼을 추가로
   * 보여준다 — 내부 화면(app/dashboard/quotations/[id]/print)은 기존대로 인쇄
   * 버튼 하나만 유지한다(사용자 확인, 2026-08-28). 서버측 PDF 생성 없이 둘 다
   * 브라우저 인쇄 대화상자(window.print())를 열며, 그 대화상자에서 "PDF로 저장"을
   * 고르면 실제 다운로드가 된다. */
  showDownloadButton?: boolean;
}) {
  // 공급가액+부가세를 더하면 조달수수료를 뺀 품목금액(VAT 포함)이 나온다
  // (서버 computeTotals와 동일한 역산 관계).
  const adjustedAmount = quotation.supplyAmount + quotation.taxAmount;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div className="flex justify-end gap-2 print:hidden">
        {showDownloadButton && (
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-bold text-ink hover:bg-[#f7f7f8]"
          >
            PDF 다운로드
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          인쇄하기
        </button>
      </div>

      <div className="overflow-hidden rounded-sm border border-hairline bg-white text-ink shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-center justify-between bg-[#262b3a] px-8 py-6 print:bg-[#262b3a]">
          <span className="w-28 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Quotation</span>
          <h1 className="text-center text-2xl font-bold tracking-[0.5em] text-white">산 출 내 역</h1>
          <span className="w-28 text-right text-[11px] text-white/60">{formatDate(quotation.quoteDate)}</span>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-start">
            <div className="flex flex-col overflow-hidden rounded-sm border border-hairline">
              <div className="bg-[#f5f5f7] px-3 py-2 text-xs font-bold text-ink">산출정보</div>
              <InfoRow label="수신" value={`${quotation.customerName} 귀중`} />
              <InfoRow label="산출명" value={quotation.projectTitle || "-"} />
              <InfoRow label="산출번호" value={quotation.quoteNumber} />
              <InfoRow label="산출일자" value={formatDate(quotation.quoteDate)} />
              <InfoRow label="유효기간" value={quotation.validUntil ? `${formatDate(quotation.validUntil)}까지` : "-"} />
              {quotation.managerName && <InfoRow label="담당자" value={quotation.managerName} />}
            </div>
            <div className="relative flex flex-col overflow-hidden rounded-sm border border-hairline">
              <div className="bg-[#f5f5f7] px-3 py-2 text-xs font-bold text-ink">공급자</div>
              <InfoRow label="상호" value={QUOTATION_SUPPLIER.name} />
              <InfoRow label="사업자번호" value={QUOTATION_SUPPLIER.businessNumber} />
              <InfoRow label="대표자" value={QUOTATION_SUPPLIER.representative} />
              <InfoRow label="주소" value={QUOTATION_SUPPLIER.address} />
              <InfoRow label="업태" value={QUOTATION_SUPPLIER.businessType} />
              <InfoRow label="종목" value={QUOTATION_SUPPLIER.businessItems} />
              <InfoRow label="TEL" value={QUOTATION_SUPPLIER.phone} />
              {quotation.includeStamp && (
                <span className="absolute right-4 top-12 flex h-12 w-12 items-center justify-center rounded-full border-2 border-semantic-error text-sm font-bold text-semantic-error">
                  인
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-sm border border-hairline bg-[#f5f5f7] px-4 py-3">
            <span className="text-sm font-medium text-ink-mute">산출금액 (VAT 포함)</span>
            <span className="text-xl font-bold tabular-nums">{formatCurrency(quotation.totalAmount)}원</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-y-2 border-ink bg-[#f5f5f7]">
                  <th className="border border-hairline px-2 py-1.5">No</th>
                  <th className="border border-hairline px-2 py-1.5">품명</th>
                  <th className="border border-hairline px-2 py-1.5">규격</th>
                  <th className="border border-hairline px-2 py-1.5">수량</th>
                  <th className="border border-hairline px-2 py-1.5">단위</th>
                  <th className="border border-hairline px-2 py-1.5">단가(VAT 포함)</th>
                  <th className="border border-hairline px-2 py-1.5">금액</th>
                  <th className="border border-hairline px-2 py-1.5">비고</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, i) => (
                  <tr key={i}>
                    <td className="border border-hairline px-2 py-1.5 text-center">{i + 1}</td>
                    <td className="border border-hairline px-2 py-1.5">{item.name}</td>
                    <td className="border border-hairline px-2 py-1.5">{item.specification}</td>
                    <td className="border border-hairline px-2 py-1.5 text-right tabular-nums">
                      {item.quantity.toLocaleString("ko-KR")}
                    </td>
                    <td className="border border-hairline px-2 py-1.5 text-center">{item.unit}</td>
                    <td className="border border-hairline px-2 py-1.5 text-right tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-hairline px-2 py-1.5 text-right tabular-nums">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="border border-hairline px-2 py-1.5">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="flex w-64 flex-col divide-y divide-hairline border-y border-hairline text-xs">
              <div className="flex items-baseline justify-between py-1.5">
                <span className="text-ink-mute">품목금액 (VAT 포함)</span>
                <span className="font-semibold tabular-nums">{formatCurrency(adjustedAmount)}원</span>
              </div>
              <div className="flex items-baseline justify-between py-1.5">
                <span className="text-ink-mute">조달수수료 (별도)</span>
                <span className="font-semibold tabular-nums">{formatCurrency(quotation.procurementFeeAmount)}원</span>
              </div>
              <div className="flex items-baseline justify-between py-1.5">
                <span className="text-ink-mute">최종 합계</span>
                <span className="text-sm font-bold tabular-nums">{formatCurrency(quotation.totalAmount)}원</span>
              </div>
              <div className="flex items-start justify-between py-1.5">
                <div>
                  <span className="text-sm font-bold text-primary">공급가액</span>
                  <p className="mt-0.5 text-[10px] text-ink-mute">세액 참고 · 품목금액 기준</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-primary">{formatCurrency(quotation.supplyAmount)}원</span>
              </div>
              <div className="flex items-baseline justify-between py-1.5">
                <span className="text-sm font-bold text-primary">부가세</span>
                <span className="text-sm font-bold tabular-nums text-primary">{formatCurrency(quotation.taxAmount)}원</span>
              </div>
            </div>
          </div>

          {quotation.memo && <p className="mt-6 whitespace-pre-wrap text-sm text-ink-mute">{quotation.memo}</p>}
        </div>
      </div>
    </div>
  );
}
