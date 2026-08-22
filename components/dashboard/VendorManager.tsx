"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

type VendorDraft = {
  companyName: string;
  businessNumber: string;
  representativeName: string;
  businessType: string;
  businessItem: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
};

const EMPTY_DRAFT: VendorDraft = {
  companyName: "",
  businessNumber: "",
  representativeName: "",
  businessType: "",
  businessItem: "",
  address: "",
  phone: "",
  email: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  contactName: "",
  contactTitle: "",
  contactPhone: "",
  contactEmail: "",
  notes: "",
};

function draftFromVendor(vendor: Vendor | null): VendorDraft {
  if (!vendor) return EMPTY_DRAFT;
  return {
    companyName: vendor.companyName ?? "",
    businessNumber: vendor.businessNumber ?? "",
    representativeName: vendor.representativeName ?? "",
    businessType: vendor.businessType ?? "",
    businessItem: vendor.businessItem ?? "",
    address: vendor.address ?? "",
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    bankName: vendor.bankName ?? "",
    accountNumber: vendor.accountNumber ?? "",
    accountHolder: vendor.accountHolder ?? "",
    contactName: vendor.contactName ?? "",
    contactTitle: vendor.contactTitle ?? "",
    contactPhone: vendor.contactPhone ?? "",
    contactEmail: vendor.contactEmail ?? "",
    notes: vendor.notes ?? "",
  };
}

export function VendorManager({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(vendors[0]?.id ?? null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<VendorDraft>(draftFromVendor(vendors[0] ?? null));
  const [uploading, setUploading] = useState<VendorDocumentType | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
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

  function updateDraft(key: keyof VendorDraft, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function choose(vendor: Vendor) {
    setSelectedId(vendor.id);
    setIsNew(false);
    setDraft(draftFromVendor(vendor));
    setMessage("");
    setError(null);
  }

  function newVendor() {
    setIsNew(true);
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setMessage("사업자등록증·통장 사본·명함을 먼저 올리거나 업체 정보를 직접 입력해 주세요.");
    setError(null);
  }

  function handleDeleteVendor(id: string) {
    if (!window.confirm("이 협력사를 삭제할까요? 첨부된 문서도 함께 삭제됩니다.")) return;
    startTransition(() => {
      void deleteVendor(id);
    });
    if (selectedId === id) setSelectedId(null);
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const formData = new FormData();
      if (selected) formData.set("id", selected.id);
      for (const [key, value] of Object.entries(draft)) {
        formData.set(key, value);
      }
      const result = await saveVendor(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("업체 정보를 저장했습니다.");
      router.refresh();
    });
  }

  async function handleUpload(type: VendorDocumentType, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const input = fileInputRefs.current[type];
    if (input) input.value = "";

    setUploading(type);
    setError(null);
    setMessage(`${DOCUMENT_LABELS[type]}을 올리고 정보를 읽는 중입니다.`);
    try {
      const formData = new FormData();
      if (selected) formData.set("vendorId", selected.id);
      formData.set("documentType", type);
      formData.set("file", file);
      const result = await uploadVendorDocument(formData);
      if (!result.ok) {
        setMessage("");
        setError(result.error);
        return;
      }
      setSelectedId(result.vendorId);
      setIsNew(false);
      // 추출된 값이 있는 필드만 폼에 반영한다(비어있는 필드는 기존 입력을 유지).
      setDraft((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(result.extracted)) {
          if (value && value.trim()) next[key as keyof VendorDraft] = value.trim();
        }
        return next;
      });
      setMessage("문서에서 읽은 정보를 반영했습니다. 확인·수정 후 저장해 주세요.");
      router.refresh();
    } finally {
      setUploading(null);
    }
  }

  function handleDeleteDocument(documentId: string, storagePath: string) {
    if (!window.confirm("이 첨부 문서를 삭제할까요?")) return;
    startTransition(() => {
      void deleteVendorDocument(documentId, storagePath);
    });
    router.refresh();
  }

  function inputField(key: keyof VendorDraft, label: string, wide?: boolean) {
    return (
      <label className={`flex flex-col gap-1 text-xs text-ink-mute ${wide ? "sm:col-span-2" : ""}`}>
        {label}
        <input
          value={draft[key]}
          onChange={(e) => updateDraft(key, e.target.value)}
          className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
        />
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="flex w-full flex-col gap-3 lg:w-72 lg:shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm">
            <strong className="text-ink">등록 업체</strong>
            <span className="rounded-md bg-canvas-cream px-2 py-0.5 text-xs font-semibold text-ink-mute">
              {vendors.length}곳
            </span>
          </div>
          <button
            type="button"
            onClick={newVendor}
            className="rounded-lg border border-primary px-3 py-1 text-xs font-bold text-primary hover:bg-canvas-lavender"
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
        <div className="flex max-h-[32rem] flex-col gap-1 overflow-y-auto rounded-lg border border-hairline bg-canvas-cream p-2">
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

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-hairline bg-canvas-cream p-4">
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
                className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
            >
              {saving ? "저장 중..." : "업체 정보 저장"}
            </button>
          </div>
        </div>

        {(message || error) && (
          <p className={`text-sm ${error ? "text-semantic-error" : "text-ink-mute"}`}>{error || message}</p>
        )}

        <section className="rounded-lg border border-hairline bg-canvas-cream p-4">
          <div className="mb-4 flex items-center justify-between">
            <strong className="text-sm font-bold text-ink">업체 문서</strong>
            <span className="text-xs text-ink-mute">JPG·PNG·WebP·PDF, 파일당 12MB 이하</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DOCUMENT_TYPES.map((type) => {
              const docs = selected?.documents.filter((d) => d.documentType === type) ?? [];
              return (
                <div key={type} className="flex flex-col gap-2 rounded-lg border border-hairline bg-[#f7f7f8] p-3">
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
                  <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-primary/40 bg-background px-3 py-2 text-xs font-medium text-ink-mute transition-colors hover:border-primary hover:text-primary">
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

        <section className="rounded-lg border border-hairline bg-canvas-cream p-4">
          <div className="mb-3">
            <strong className="text-sm text-ink">사업자 정보</strong>
            <span className="ml-2 text-xs text-ink-mute">사업자등록증에서 자동 입력</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {inputField("companyName", "업체명 *")}
            {inputField("businessNumber", "사업자등록번호")}
            {inputField("representativeName", "대표자")}
            {inputField("phone", "대표 전화")}
            {inputField("businessType", "업태")}
            {inputField("businessItem", "종목")}
            {inputField("address", "주소", true)}
            {inputField("email", "대표 이메일")}
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas-cream p-4">
          <div className="mb-3">
            <strong className="text-sm text-ink">정산 계좌</strong>
            <span className="ml-2 text-xs text-ink-mute">통장 사본에서 자동 입력</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {inputField("bankName", "은행")}
            {inputField("accountNumber", "계좌번호")}
            {inputField("accountHolder", "예금주")}
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas-cream p-4">
          <div className="mb-3">
            <strong className="text-sm text-ink">담당자 정보</strong>
            <span className="ml-2 text-xs text-ink-mute">명함에서 자동 입력</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {inputField("contactName", "담당자")}
            {inputField("contactTitle", "직함")}
            {inputField("contactPhone", "연락처")}
            {inputField("contactEmail", "이메일")}
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-canvas-cream p-4">
          <strong className="mb-2 block text-sm text-ink">참고 사항</strong>
          <textarea
            value={draft.notes}
            onChange={(e) => updateDraft("notes", e.target.value)}
            placeholder="계약·정산·연락 시 참고할 내용을 입력하세요."
            rows={3}
            className="w-full rounded-md border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </section>
      </div>
    </div>
  );
}
