import "server-only";
import nodemailer from "nodemailer";

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMaterialEmail(params: {
  to: string[];
  subject: string;
  message: string;
  senderName: string;
  files: { name: string; link: string }[];
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

  const fileListHtml =
    params.files.length > 0
      ? `<p style="margin:20px 0 8px;font-weight:600;">첨부 자료</p><ul style="margin:0;padding-left:20px;">${params.files
          .map(
            (f) =>
              `<li style="margin-bottom:4px;"><a href="${f.link}" style="color:#2557d6;">${escapeHtml(f.name)}</a></li>`
          )
          .join("")}</ul>`
      : "";

  const html = `
    <div style="font-family:-apple-system,'Malgun Gothic',sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;max-width:560px;">
      <p style="white-space:pre-wrap;margin:0;">${escapeHtml(params.message)}</p>
      ${fileListHtml}
      <p style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e5e5;color:#888;font-size:12px;">
        ${escapeHtml(params.senderName)}님이 AIRPASS 자료메일발송을 통해 보냈습니다.
      </p>
    </div>
  `;

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
