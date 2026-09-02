import "server-only";
import { Readable } from "node:stream";
import { google } from "googleapis";

// Memo Board/Work Journal/제조사 관리 첨부파일을 Supabase Storage 대신 회사 공용
// 구글드라이브(서비스 계정)에 올린다(2026-09-02, Supabase 스토리지 용량 초과 대응
// — 사용자 확인). lib/googleDriveMaterials.ts와 같은 서비스 계정 자격증명을
// 재사용하지만, 그건 "자료메일발송용 고정 카탈로그 폴더를 읽기만" 하는 목적이라
// 별도 모듈로 분리했다 — 이 모듈은 여러 서비스가 각자 하위 폴더에 쓰기(업로드·삭제)
// 위한 것이라 책임이 다르다.

export type AttachmentService = "vendor" | "journal" | "memo";

const SERVICE_FOLDER_NAMES: Record<AttachmentService, string> = {
  vendor: "제조사 관리",
  journal: "Work Journal",
  memo: "Memo Board",
};

export const isGoogleDriveAttachmentsConfigured = Boolean(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_ATTACHMENTS_ROOT_FOLDER_ID
);

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY가 설정되지 않았습니다.");
  }
  const key = rawKey.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/drive"] });
  return google.drive({ version: "v3", auth });
}

function getRootFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_ATTACHMENTS_ROOT_FOLDER_ID;
  if (!id) throw new Error("GOOGLE_DRIVE_ATTACHMENTS_ROOT_FOLDER_ID가 설정되지 않았습니다.");
  return id;
}

/** 루트 폴더 아래 서비스별 하위 폴더를 찾고, 없으면 새로 만든다(최초 업로드 시
 * 1회만 생성, 이후로는 재사용) — "디렉토리는 서비스별로" 요구사항(2026-09-02). */
async function ensureServiceFolder(
  drive: ReturnType<typeof getDriveClient>,
  service: AttachmentService
): Promise<string> {
  const rootId = getRootFolderId();
  const name = SERVICE_FOLDER_NAMES[service];

  const existing = await drive.files.list({
    q: `'${rootId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });
  const found = existing.data.files?.[0]?.id;
  if (found) return found;

  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [rootId] },
    fields: "id",
  });
  if (!created.data.id) throw new Error(`"${name}" 폴더 생성에 실패했습니다.`);
  return created.data.id;
}

/** 파일을 해당 서비스 하위 폴더에 올리고, 팀 전체가 바로 열람할 수 있도록
 * "링크가 있는 모든 사용자" 읽기 권한까지 부여한 뒤 파일 id를 돌려준다. */
export async function uploadAttachmentToDrive(
  service: AttachmentService,
  fileName: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<string> {
  const drive = getDriveClient();
  const folderId = await ensureServiceFolder(drive, service);

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(Buffer.from(bytes)) },
    fields: "id",
  });
  const fileId = res.data.id;
  if (!fileId) throw new Error(`"${fileName}" 업로드에 실패했습니다.`);

  await drive.permissions.create({
    fileId,
    requestBody: { type: "anyone", role: "reader" },
  });

  return fileId;
}

/** 구글드라이브 파일은 Supabase Storage의 서명 URL과 달리 만료되지 않는 고정
 * 링크라, 업로드 시점에 한 번만 공유 권한을 주면 이후엔 API 호출 없이 이 URL
 * 형식으로 바로 열람 가능하다. */
export function driveFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/** 실패해도(이미 지워졌거나 권한 문제) 호출부의 DB 행 삭제까지 막으면 안 되므로
 * 에러를 삼킨다 — 정리가 덜 된 파일이 드라이브에 남을 수 있지만, DB 정합성이
 * 더 중요하다(Supabase Storage 삭제 실패를 조용히 무시하던 기존 방식과 동일). */
export async function deleteAttachmentFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
  } catch (e) {
    console.error(`[deleteAttachmentFromDrive] 삭제 실패 (${fileId}):`, e instanceof Error ? e.message : e);
  }
}
