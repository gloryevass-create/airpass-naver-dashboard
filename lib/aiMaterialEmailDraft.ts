import type { AiMaterialEmailDraft } from "@/lib/aiCommand";

/** AiCommandBar가 sessionStorage에 남겨둔 초안을 MaterialEmailForm이 마운트 시
 * 읽어 미리 채운다 — 자료메일발송은 실제 이메일 발송이라 AI가 자동 등록하지
 * 않고(사용자 확인, 2026-08-26) 항상 이 화면으로 안내만 한다. */
export const AI_MATERIAL_EMAIL_DRAFT_KEY = "ai-material-email-draft";

export type { AiMaterialEmailDraft };
