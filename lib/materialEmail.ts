import "server-only";
import { Resend } from "resend";

export const isMaterialEmailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.MATERIAL_EMAIL_FROM);

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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MATERIAL_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY/MATERIAL_EMAIL_FROM이 설정되지 않았습니다.");
  }

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

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html,
  });
  if (error) throw new Error(error.message);
}
