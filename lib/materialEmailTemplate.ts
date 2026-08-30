// 자료메일발송 이메일 본문 HTML을 만드는 순수 함수 — 서버 전용 I/O(구글드라이브 API,
// SMTP)가 전혀 없어 클라이언트(미리보기)와 서버(실제 발송) 양쪽에서 그대로 재사용한다.
// 사용자가 Claude Design으로 만든 "메일 상세 화면" 템플릿을 그대로 이식했다(2026-08-28).
import { QUOTATION_SUPPLIER } from "@/lib/quotationCompany";

export type MaterialEmailFileLink = { name: string; link: string };
export type MaterialEmailProductLink = { label: string; link: string | null };
export type MaterialEmailQuotation = { quoteNumber: string; customerName: string; printUrl: string } | null;

// 템플릿의 "회사 및 제품소개 자료" 항목 — 자료메일발송 폴더(구글드라이브)에서
// 이 키워드를 모두 포함하는 파일명을 찾아 연결한다(사용자 확인, 2026-08-28). 못
// 찾으면 그 항목은 이메일에서 빠진다(가짜 링크를 만들지 않음). 회사소개서는 맨
// 위에 고정 노출한다 — "아이핏" 키워드가 다른 파일과 잘못 매칭돼 엉뚱한 링크로
// 연결되는 문제가 있어 그 항목은 제거함(사용자 확인, 2026-08-28).
export const PRODUCT_MATERIAL_CATALOG: { label: string; keywords: string[] }[] = [
  { label: "에어패스 회사소개서", keywords: ["회사소개"] },
  { label: "에어패스 가상사격 시스템 브로셔", keywords: ["가상사격"] },
  { label: "마이베네핏 VM2 제품소개서", keywords: ["마이베네핏"] },
  { label: "올댓비전 스마트미러 제품소개서", keywords: ["올댓비전", "스마트미러"] },
  { label: "올댓비전 스마트PAPS 제품소개서", keywords: ["올댓비전", "스마트PAPS"] },
  { label: "올댓비전 스마트 테이블축구 제품소개서", keywords: ["올댓비전", "테이블축구"] },
  { label: "메타에듀시스 VR·충전보관함 브로셔", keywords: ["메타에듀시스"] },
];

// macOS(파인더)에서 올린 한글 파일명은 자모가 분리된 NFD로 저장되는 경우가 많아,
// 소스 코드의 NFC 문자열(예: "회사소개")과 바이트 단위로 달라 .includes()가 실패할
// 수 있다 — 양쪽 다 NFC로 정규화한 뒤 비교한다(사용자가 실제로 겪은 매칭 실패,
// 2026-08-28).
function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase();
}

/** PRODUCT_MATERIAL_CATALOG의 각 항목에 대해, 이름이 일치하는 파일의 id를 찾는다
 * (없으면 null — 호출부가 실제 링크 생성 여부를 판단). */
export function matchProductMaterialFiles<T extends { id: string; name: string }>(
  files: T[]
): { label: string; fileId: string | null }[] {
  return PRODUCT_MATERIAL_CATALOG.map(({ label, keywords }) => {
    const match = files.find((f) => keywords.every((k) => normalize(f.name).includes(normalize(k))));
    return { label, fileId: match ? match.id : null };
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkPill(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="background:#eef2ff;border-radius:8px;padding:14px 18px;font-size:14.5px;font-weight:600;color:#2b6bff;text-decoration:none;">${escapeHtml(label)} →</a>`;
}

function fileListBlock(title: string, files: MaterialEmailFileLink[]): string {
  if (files.length === 0) return "";
  return `
      <div style="font-size:15px;font-weight:700;color:#111827;margin:0 0 10px;">${escapeHtml(title)}</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;">${files.map((f) => linkPill(f.name, f.link)).join("")}</div>
  `;
}

// 산출내역을 첨부하지 않아도 이 섹션 전체(제목·3개 안내 카드)는 항상 보여주고,
// 견적서 하이라이트 박스만 "견적내용이 없습니다."로 바뀐다 — 예전엔 산출내역이
// 없으면 섹션이 통째로 사라졌는데, 그 3개 카드는 산출내역과 무관한 일반 서비스
// 안내라 항상 노출하는 쪽으로 바꿨다(사용자 확인, 2026-08-30).
function quotationSectionHtml(quotation: MaterialEmailQuotation): string {
  const quotationBoxHtml = quotation
    ? `
        <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:4px;">견적서 원본 PDF 열람 · 다운로드</div>
        <a href="${escapeHtml(quotation.printUrl)}" style="display:inline-block;background:#2b6bff;color:#fff;border-radius:6px;padding:10px 18px;font-size:13.5px;font-weight:700;text-decoration:none;">${escapeHtml(quotation.quoteNumber)} 견적서 보기 →</a>
    `
    : `<div style="font-size:14.5px;color:#6b7280;">견적내용이 없습니다.</div>`;

  return `
      <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 4px;">견적 및 제품자료 안내</h2>
      <div style="width:36px;height:3px;background:#22c55e;border-radius:2px;margin-bottom:18px;"></div>

      <div style="background:#f0f5ff;border:1px solid #dbe6fe;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
        ${quotationBoxHtml}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:44px;">
        <div style="background:#0b1f4d;color:#fff;border-radius:10px;padding:20px;">
          <div style="font-size:12px;font-weight:700;color:#93a5d6;margin-bottom:10px;">01</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;">제품자료 제공</div>
          <div style="font-size:12.5px;color:#c3cce6;line-height:1.6;">에어패스·올댓비전<br>메타에듀시스 등</div>
        </div>
        <div style="background:#2b6bff;color:#fff;border-radius:10px;padding:20px;">
          <div style="font-size:12px;font-weight:700;color:#bcd0ff;margin-bottom:10px;">02</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;">구성 검토 지원</div>
          <div style="font-size:12.5px;color:#dbe6ff;line-height:1.6;">예산·공간 여건에 맞는<br>품목 조정 및 제안</div>
        </div>
        <div style="background:#34d3c4;color:#083c38;border-radius:10px;padding:20px;">
          <div style="font-size:12px;font-weight:700;color:#0b5f57;margin-bottom:10px;">03</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;">구축 이후 지원</div>
          <div style="font-size:12.5px;color:#1f5c55;line-height:1.6;">설치·교육·유지보수<br>연계 지원</div>
        </div>
      </div>
  `;
}

// 원본 템플릿에는 이 제목·설명이 고정으로 있다 — 매칭된 링크가 하나도 없어도
// (자료 폴더 파일명이 아직 카탈로그와 안 맞을 때) 제목 자체는 그대로 보이게 한다
// (사용자 확인, 2026-08-28 — 매칭 실패로 제목까지 통째로 사라졌던 문제).
function productLinksSectionHtml(productLinks: MaterialEmailProductLink[]): string {
  const matched = productLinks.filter((p): p is { label: string; link: string } => p.link != null);
  return `
      <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 4px;">회사 및 제품소개 자료</h2>
      <div style="width:36px;height:3px;background:#2b6bff;border-radius:2px;margin-bottom:14px;"></div>
      <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 18px;">
        아래 항목을 선택하시면 공용 자료 폴더에서 바로 확인하거나 다운로드하실 수 있습니다.
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:40px;">${matched.map((p) => linkPill(p.label, p.link)).join("")}</div>
  `;
}

export function buildMaterialEmailHtml(params: {
  subject: string;
  message: string;
  senderName: string;
  senderTitle: string | null;
  senderEmail: string;
  senderPhone: string | null;
  documents: MaterialEmailFileLink[];
  videos: MaterialEmailFileLink[];
  quotation: MaterialEmailQuotation;
  productLinks: MaterialEmailProductLink[];
}): string {
  const { subject, message, senderName, senderTitle, senderEmail, senderPhone, documents, videos, quotation, productLinks } = params;

  const senderLine = senderTitle ? `${escapeHtml(senderName)} ${escapeHtml(senderTitle)}` : escapeHtml(senderName);
  // 개인 핸드폰번호(profiles.phone)가 등록돼 있을 때만 M. 줄을 보여준다 — 회사
  // 대표번호(T.)는 QUOTATION_SUPPLIER 고정값 그대로 항상 표시한다.
  const phoneLine = senderPhone ? `M. ${escapeHtml(senderPhone)} · ` : "";
  const attachedFilesHtml = fileListBlock("📄 첨부 문서", documents) + fileListBlock("🎬 첨부 영상", videos);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;background:#f3f4f6;font-family:'Pretendard',-apple-system,'Malgun Gothic',sans-serif;">
  <div style="width:100%;max-width:1200px;margin:0 auto;padding:32px 24px 80px;box-sizing:border-box;">
    <div style="background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">

      <div style="padding:8px 40px 0;">
        <div style="font-size:20px;font-weight:700;color:#111827;padding:16px 0 20px;border-bottom:1px solid #f3f4f6;">${escapeHtml(subject)}</div>
      </div>

      <div style="padding:36px 40px 44px;">
        <div style="display:inline-flex;align-items:center;gap:8px;background:#eef2ff;color:#0b1f4d;font-size:12px;font-weight:700;letter-spacing:0.03em;padding:6px 12px;border-radius:20px;margin-bottom:18px;">· AIRPASS</div>

        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 6px;">${escapeHtml(subject)}</p>
        <p style="font-size:15px;color:#111827;line-height:1.7;margin:0 0 28px;white-space:pre-wrap;">${escapeHtml(message)}</p>

        <div style="background:#f8f9fb;border-left:3px solid #2b6bff;border-radius:8px;padding:22px 24px;margin-bottom:36px;">
          <div style="font-size:12px;font-weight:700;color:#2b6bff;letter-spacing:0.04em;margin-bottom:8px;">ABOUT AIRPASS</div>
          <div style="font-size:17px;font-weight:700;color:#111827;margin-bottom:10px;">SI컨설팅, 디지털스포츠, 공간재구조화 등 학교와 공공기관들이 디지털, AI 환경 구축을 종합적으로 컨설팅 해드립니다.</div>
          <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0;">저희 주식회사 에어패스는 학교와 공공기관의 교육·체육 공간 구축을 지원하고 있습니다.</p>
        </div>

        ${quotationSectionHtml(quotation)}
        ${productLinksSectionHtml(productLinks)}
        ${attachedFilesHtml}

        <p style="font-size:14.5px;color:#374151;line-height:1.8;margin:0 0 20px;">
          검토 중 궁금하신 사항이나 추가로 필요하신 자료가 있으시면 편하게 말씀 부탁드립니다.
        </p>
        <p style="font-size:14.5px;color:#111827;line-height:1.8;margin:0 0 30px;">
          감사합니다.<br>
          <strong>주식회사 에어패스</strong>
        </p>

        <div style="background:#f8f9fb;border-left:3px solid #2b6bff;border-radius:8px;padding:20px 24px;margin-bottom:16px;">
          <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:8px;">${senderLine}</div>
          <div style="font-size:13.5px;color:#6b7280;line-height:1.7;">
            ${phoneLine}T. ${escapeHtml(QUOTATION_SUPPLIER.phone)}<br>
            E. ${escapeHtml(senderEmail)}
          </div>
        </div>

        <div style="border-top:1px solid #f0f1f3;padding-top:16px;font-size:12.5px;color:#9ca3af;">*당사에 관심을 갖아주셔서 감사드립니다.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
