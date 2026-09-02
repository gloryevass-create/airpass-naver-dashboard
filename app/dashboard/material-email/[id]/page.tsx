import "@/components/industryTheme.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMaterialEmailLogById } from "@/lib/queries/materialEmailLogs";
import { getQuotation } from "@/lib/queries/quotations";
import { resolveBaseUrl, resolveProductLinks } from "@/app/dashboard/actions/materialEmail";
import { buildMaterialEmailHtml, isVideoFileName } from "@/lib/materialEmailTemplate";

// 서버 컴포넌트(Vercel UTC 런타임)라 timeZone을 명시하지 않으면 실제 한국시간보다
// 9시간 느리게 표시된다(2026-09-03 관리자 페이지 로그인 기록에서 신고).
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

type Params = Promise<{ id: string }>;

// 발송 이력은 실제로 보낸 메일 본문 HTML을 저장하지 않는다(제목·안내문·자료
// 이름/링크·산출내역 id만 감사 기록용으로 남김) — 그래서 지금 이 자료들로
// buildMaterialEmailHtml을 다시 호출해 "재구성"한 결과를 보여준다. 실제 발송
// 시점과 달라질 수 있는 부분: (1) 발신자 서명(이름/직함/핸드폰)은 그 사이
// profiles가 바뀌었으면 지금 값으로 보인다, (2) 회사소개 자료 3개 카드 링크는
// 그 사이 구글드라이브 폴더 파일이 바뀌었으면 지금 상태로 다시 매칭된다,
// (3) 문서/동영상 구분은 mimeType을 저장 안 해서 파일명 확장자로 근사한다.
// 제목·안내문·수신자·보낸 자료 목록·산출내역 자체는 이력에 그대로 저장된
// 값이라 정확하다.
export default async function MaterialEmailLogDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase } = await requireAuthedClient();

  const log = await getMaterialEmailLogById(supabase, id);
  if (!log) notFound();

  const [{ data: senderProfile }, quotation, productLinks, baseUrl] = await Promise.all([
    supabase.from("profiles").select("name, title, phone").eq("id", log.senderId).maybeSingle(),
    log.quotationId ? getQuotation(supabase, log.quotationId) : Promise.resolve(null),
    resolveProductLinks().catch(() => []),
    resolveBaseUrl(),
  ]);

  const files = log.fileNames.map((name, i) => ({ name, link: log.fileLinks[i] ?? "#" }));
  const documents = files.filter((f) => !isVideoFileName(f.name));
  const videos = files.filter((f) => isVideoFileName(f.name));

  const html = buildMaterialEmailHtml({
    subject: log.subject,
    message: log.message,
    senderName: senderProfile?.name ?? log.senderEmail,
    senderTitle: senderProfile?.title ?? null,
    senderEmail: log.senderEmail,
    senderPhone: senderProfile?.phone ?? null,
    logoUrl: `${baseUrl}/airpass-logo.png`,
    documents,
    videos,
    quotation: quotation
      ? { quoteNumber: quotation.quoteNumber, customerName: quotation.customerName, printUrl: `${baseUrl}/quote/${quotation.id}` }
      : null,
    productLinks,
  });

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 960, margin: "0 auto" }}>
      <Link
        href="/dashboard/material-email"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-accent-700)", textDecoration: "none", marginBottom: "var(--space-4)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        자료메일발송으로 돌아가기
      </Link>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: "0 0 var(--space-2)", color: "var(--color-accent-700)" }}>
        {log.subject}
      </h1>
      <div className="text-muted" style={{ fontSize: 12, marginBottom: "var(--space-1)" }}>
        {log.senderEmail} · {formatDateTime(log.createdAt)}
      </div>
      <div className="text-muted" style={{ fontSize: 12, marginBottom: "var(--space-4)" }}>
        받는 사람: {log.recipientEmails.join(", ")}
      </div>

      <p className="text-muted" style={{ fontSize: 12, marginBottom: "var(--space-4)" }}>
        아래는 발송 당시 저장된 제목·안내문·자료 목록으로 다시 구성한 메일 본문입니다. 발신자 서명이나
        회사소개 자료 링크는 지금 시점 기준으로 다시 만들어져 실제 발송 당시와 다를 수 있습니다.
      </p>

      <div style={{ border: "1px solid var(--color-divider)" }}>
        <iframe title="발송된 메일" srcDoc={html} style={{ height: "80vh", width: "100%", border: 0 }} />
      </div>
    </div>
  );
}
