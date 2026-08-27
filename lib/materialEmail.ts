import "server-only";
import nodemailer from "nodemailer";
import {
  buildMaterialEmailHtml,
  type MaterialEmailFileLink,
  type MaterialEmailProductLink,
  type MaterialEmailQuotation,
} from "@/lib/materialEmailTemplate";

// Resend 같은 이메일 API 대신, 실제 회사 메일 계정(하이웍스 등)에 SMTP로 직접
// 로그인해서 그 계정 이름으로 보낸다 — 도메인 인증(DNS) 없이 바로 쓸 수 있다는
// 장점이 있지만, 이메일 API 키와 달리 "발송 전용" 권한 분리가 안 되고 실제
// 메일함 로그인 비밀번호를 그대로 쓴다는 차이가 있다(사용자 확인, 2026-08-23).
export const isMaterialEmailConfigured = Boolean(
  process.env.MATERIAL_EMAIL_SMTP_HOST &&
    process.env.MATERIAL_EMAIL_SMTP_PORT &&
    process.env.MATERIAL_EMAIL_SMTP_USER &&
    process.env.MATERIAL_EMAIL_SMTP_PASSWORD
);

export async function sendMaterialEmail(params: {
  to: string[];
  subject: string;
  message: string;
  senderName: string;
  senderTitle: string | null;
  senderEmail: string;
  documents: MaterialEmailFileLink[];
  videos: MaterialEmailFileLink[];
  quotation: MaterialEmailQuotation;
  productLinks: MaterialEmailProductLink[];
}): Promise<void> {
  const host = process.env.MATERIAL_EMAIL_SMTP_HOST;
  const port = Number(process.env.MATERIAL_EMAIL_SMTP_PORT);
  const user = process.env.MATERIAL_EMAIL_SMTP_USER;
  const password = process.env.MATERIAL_EMAIL_SMTP_PASSWORD;
  if (!host || !port || !user || !password) {
    throw new Error(
      "MATERIAL_EMAIL_SMTP_HOST/MATERIAL_EMAIL_SMTP_PORT/MATERIAL_EMAIL_SMTP_USER/MATERIAL_EMAIL_SMTP_PASSWORD가 설정되지 않았습니다."
    );
  }
  const fromName = process.env.MATERIAL_EMAIL_FROM_NAME;

  const html = buildMaterialEmailHtml({
    subject: params.subject,
    message: params.message,
    senderName: params.senderName,
    senderTitle: params.senderTitle,
    senderEmail: params.senderEmail,
    documents: params.documents,
    videos: params.videos,
    quotation: params.quotation,
    productLinks: params.productLinks,
  });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: fromName ? { name: fromName, address: user } : user,
    to: params.to,
    subject: params.subject,
    html,
  });
}
