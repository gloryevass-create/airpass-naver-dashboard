"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import type { Vendor, VendorDocumentType } from "@/lib/queries/vendors";
import { saveVendor, deleteVendor, uploadVendorDocument, deleteVendorDocument } from "@/app/dashboard/actions/vendors";

const DOCUMENT_LABELS: Record<VendorDocumentType, string> = {
  business_registration: "사업자등록증",
  bankbook: "통장 사본",
  business_card: "명함",
};
const DOCUMENT_HINTS: Record<VendorDocumentType, string> = {
  business_registration: "업체명·사업자번호·대표자·주소·업태·종목",
  bankbook: "은행·계좌번호·예금주",
  business_card: "담당자·직함·연락처·이메일",
};
const DOCUMENT_TYPES = Object.keys(DOCUMENT_LABELS) as VendorDocumentType[];

function field(
  key: string,
  label: string,
  defaultValue: string | null,
  extra?: { wide?: boolean; type?: string }
) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-ink-mute ${extra?.wide ? "sm:col-span-2" : ""}`}>
      {label}
      <input
        name={key}
        type={extra?.type ?? "text"}
        defaultValue={defaultValue ?? ""}
        className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
      />
    </label>
  );
}

export function VendorManager({ vendors }: { vendors: Vendor[] }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(vendors[0]?.id ?? null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState<VendorDocumentType | null>(null);
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();
  const fileInputRefs = useRef<Partial<Record<VendorDocumentType, HTMLInputElement | null>>>({});

  const selected = isNew ? null : vendors.find((v) => v.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      `${v.companyName} ${v.businessNumber ?? ""} ${v.contactName ?? ""} ${v.phone ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [vendors, search]);

  const [state, formAction, pending] = useActionState(saveVendor, undefined);

  function choose(vendor: Vendor) {
    setSelectedId(vendor.id);
    setIsNew(false);
    setMessage("");
  }

  function newVendor() {
    setIsNew(true);
    setSelectedId(null);
    setMessage("사업자등록증·통장 사본·명함을 먼저 올리거나 업체 정보를 직접 입력해 주세요.");
  }

  function handleDeleteVendor(id: string) {
    if (!window.confirm("이 협력사를 삭제할까요? 첨부된 문서도 함께 삭제됩니다.")) return;
    startTransition(() => {
      void deleteVendor(id);
    });
    if (selectedId === id) setSelectedId(null);
  }

  async function handleUpload(type: VendorDocumentType, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const input = fileInputRefs.current[type];
    if (input) input.value = "";

    setUploading(type);
    setMessage(`${DOCUMENT_LABELS[type]}을 올리고 정보를 읽는 중입니다.`);
    try {
      const formData = new FormData();
      if (selected) formData.set("vendorId", selected.id);
      formData.set("documentType", type);
      formData.set("file", file);
      const result = await uploadVendorDocument(formData);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setSelectedId(result.vendorId);
      setIsNew(false);
      setMessage("문서에서 읽은 정보를 반영했습니다. 확인·수정 후 저장해 주세요.");
    } finally {
      setUploading(null);
    }
  }

  function handleDeleteDocument(documentId: string, storagePath: string) {
    if (!window.confirm("이 첨부 문서를 삭제할까요?")) return;
    startTransition(() => {
      void deleteVendorDocument(documentId, storagePath);
    });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="flex w-full flex-col gap-3 lg:w-72 lg:shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm">
            <strong className="text-ink">등록 업체</strong>
            <span className="rounded-full bg-canvas-cream px-2 py-0.5 text-xs font-semibold text-ink-mute">
              {vendors.length}곳
            </span>
          </div>
          <button
            type="button"
            onClick={newVendor}
            className="rounded-full border border-primary px-3 py-1 text-xs font-bold text-primary hover:bg-canvas-lavender"
          >
            + 새 업체
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업체명·사업자번호·담당자 검색"
          className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
        />
        <div className="flex max-h-[32rem] flex-col gap-1 overflow-y-auto rounded-xl border border-hairline bg-canvas-cream p-2">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => choose(v)}
              className={`flex flex-col gap-0.5 rounded-md border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                selected?.id === v.id
                  ? "border-l-primary bg-canvas-lavender/60"
                  : "border-l-transparent hover:bg-[#f7f7f8]"
              }`}
            >
              <span className={`font-medium ${selected?.id === v.id ? "text-primary" : "text-ink"}`}>
                {v.companyName}
              </span>
              <span className="text-xs text-ink-mute">{v.businessNumber || "사업자번호 미등록"}</span>
              <span className="text-xs text-ink-mute">
                {v.contactName || v.phone || "담당자 정보 미등록"}
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-mute">등록된 업체가 없습니다.</p>}
        </div>
      </aside>

      <form action={formAction} className="flex flex-1 flex-col gap-4">
        {(selected || isNew) && <input type="hidden" name="id" value={selected?.id ?? ""} />}
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-canvas-cream p-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Partner Vendor</span>
            <h2 className="mt-0.5 text-lg font-bold text-ink">
              {selected ? selected.companyName || "업체 정보" : "새 협력사 등록"}
            </h2>
            <p className="mt-0.5 text-xs text-ink-mute">문서를 올리면 내용을 자동 입력하며, 모든 항목은 직접 수정할 수 있습니다.</p>
          </div>
          <div className="flex items-center gap-2">
            {selected && (
              <button
                type="button"
                onClick={() => handleDeleteVendor(selected.id)}
                className="rounded-full border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
              >
                삭제
              </button>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
            >
              {pending ? "저장 중..." : "업체 정보 저장"}
            </button>
          </div>
        </div>

        {(message || state?.error) && (
          <p className={`text-sm ${state?.error ? "text-semantic-error" : "text-ink-mute"}`}>
            {state?.error || message}
          </p>
        )}

        <section className="rounded-xl border border-hairline bg-canvas-cream p-4">
          <div className="mb-4 flex items-center justify-between">
            <strong className="text-sm font-bold text-ink">업체 문서</strong>
            <span className="text-xs text-ink-mute">JPG·PNG·WebP·PDF, 파일당 12MB 이하</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DOCUMENT_TYPES.map((type, i) => {
              const docs = selected?.documents.filter((d) => d.documentType === type) ?? [];
              return (
                <div
                  key={type}
                  className={`flex flex-col gap-2 ${i > 0 ? "sm:border-l sm:border-hairline sm:pl-4" : ""}`}
                >
                  <div>
                    <b className="text-sm text-ink">{DOCUMENT_LABELS[type]}</b>
                    <p className="text-xs text-ink-mute">{DOCUMENT_HINTS[type]}</p>
                  </div>
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 text-xs">
                      {doc.signedUrl ? (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-link-blue hover:underline"
                        >
                          {doc.originalName}
                        </a>
                      ) : (
                        <span className="truncate text-ink-mute">{doc.originalName}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.storagePath)}
                        className="shrink-0 text-semantic-error hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-hairline px-3 py-2 text-xs font-medium text-ink-mute transition-colors hover:border-primary hover:text-primary">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[type] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={uploading !== null}
                      onChange={(e) => void handleUpload(type, e.target.files)}
                      className="hidden"
                    />
                    {uploading === type ? "정보 읽는 중..." : docs.length ? "파일 추가·교체" : "파일 선택"}
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-canvas-cream p-4">
          <div className="mb-3">
            <strong className="text-sm text-ink">사업자 정보</strong>
            <span className="ml-2 text-xs text-ink-mute">사업자등록증에서 자동 입력</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {field("companyName", "업체명 *", selected?.companyName ?? null)}
            {field("businessNumber", "사업자등록번호", selected?.businessNumber ?? null)}
            {field("representativeName", "대표자", selected?.representativeName ?? null)}
            {field("phone", "대표 전화", selected?.phone ?? null)}
            {field("businessType", "업태", selected?.businessType ?? null)}
            {field("businessItem", "종목", selected?.businessItem ?? null)}
            {field("address", "주소", selected?.address ?? null, { wide: true })}
            {field("email", "대표 이메일", selected?.email ?? null)}
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-canvas-cream p-4">
          <div className="mb-3">
            <strong className="text-sm text-ink">정산 계좌</strong>
            <span className="ml-2 text-xs text-ink-mute">통장 사본에서 자동 입력</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {field("bankName", "은행", selected?.bankName ?? null)}
            {field("accountNumber", "계좌번호", selected?.accountNumber ?? null)}
            {field("accountHolder", "예금주", selected?.accountHolder ?? null)}
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-canvas-cream p-4">
          <div className="mb-3">
            <strong className="text-sm text-ink">담당자 정보</strong>
            <span className="ml-2 text-xs text-ink-mute">명함에서 자동 입력</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {field("contactName", "담당자", selected?.contactName ?? null)}
            {field("contactTitle", "직함", selected?.contactTitle ?? null)}
            {field("contactPhone", "연락처", selected?.contactPhone ?? null)}
            {field("contactEmail", "이메일", selected?.contactEmail ?? null)}
          </div>
        </section>

        <section className="rounded-xl border border-hairline bg-canvas-cream p-4">
          <strong className="mb-2 block text-sm text-ink">참고 사항</strong>
          <textarea
            name="notes"
            defaultValue={selected?.notes ?? ""}
            placeholder="계약·정산·연락 시 참고할 내용을 입력하세요."
            rows={3}
            className="w-full rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </section>
      </form>
    </div>
  );
}
