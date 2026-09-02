import "server-only";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshDriveAccessToken } from "@/lib/googleDriveUpload/oauth";

// Memo Board/Work Journal/제조사 관리 첨부파일을 Supabase Storage 대신 회사 공용
// 구글드라이브에 올린다(2026-09-02, Supabase 스토리지 용량 초과 대응 — 사용자 확인).
//
// 처음엔 lib/googleDriveMaterials.ts와 같은 서비스 계정(JWT)으로 시도했으나, 구글
// 서비스 계정은 자체 저장용량이 0이라 파일 생성(쓰기) 자체가 "storageQuotaExceeded"로
// 막혀 있다는 걸 실제 업로드에서 확인했다(읽기·공유는 되지만 쓰기는 안 됨 — 그래서
// 읽기만 하는 자료메일발송 기능에서는 이 문제가 안 드러났다). 그래서 실제 사람 계정
// (airpass.ai@gmail.com)의 OAuth 연결(google_drive_upload_connection, 회사 전체가
// 공유하는 싱글턴 — app/auth/google-drive-upload/*)로 바꿨다(2026-09-03) — 업로드
// 용량은 그 계정의 개인 구글 드라이브 용량을 그대로 쓴다.
export type AttachmentService = "vendor" | "journal" | "memo";

const SERVICE_FOLDER_NAMES: Record<AttachmentService, string> = {
  vendor: "제조사 관리",
  journal: "Work Journal",
  memo: "Memo Board",
};

function getRootFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_ATTACHMENTS_ROOT_FOLDER_ID;
  if (!id) throw new Error("GOOGLE_DRIVE_ATTACHMENTS_ROOT_FOLDER_ID가 설정되지 않았습니다.");
  return id;
}

/** 연결된 계정의 access_token을 돌려준다(없거나 곧 만료되면 refresh_token으로 새로
 * 받아 DB 캐시도 같이 갱신) — lib/queries/googleCalendar.ts::getValidGoogleAccessToken과
 * 같은 패턴. 연결 자체가 없으면 null. */
async function getValidDriveAccessToken(): Promise<string | null> {
  const admin = createAdminClient();
  const { data: conn } = await admin.from("google_drive_upload_connection").select("*").eq("id", true).maybeSingle();
  if (!conn) return null;

  let accessToken = conn.access_token;
  const expiresSoon =
    !conn.access_token_expires_at || new Date(conn.access_token_expires_at).getTime() < Date.now() + 60_000;

  if (!accessToken || expiresSoon) {
    try {
      const refreshed = await refreshDriveAccessToken(conn.refresh_token);
      accessToken = refreshed.access_token;
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await admin
        .from("google_drive_upload_connection")
        .update({ access_token: accessToken, access_token_expires_at: expiresAt })
        .eq("id", true);
    } catch (e) {
      console.error("[getValidDriveAccessToken] 토큰 갱신 실패:", e instanceof Error ? e.message : e);
      return null;
    }
  }

  return accessToken;
}

/** 루트 폴더 환경변수가 있고 실제로 연결된 계정(refresh_token)이 있어야 "설정됨"으로
 * 본다 — 둘 중 하나라도 없으면 호출부(각 action 파일)가 예전처럼 Supabase Storage
 * 업로드로 자동 폴백한다. DB 조회가 필요해 예전(동기 상수)과 달리 비동기 함수다. */
export async function isGoogleDriveAttachmentsConfigured(): Promise<boolean> {
  if (!process.env.GOOGLE_DRIVE_ATTACHMENTS_ROOT_FOLDER_ID) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_drive_upload_connection")
    .select("id")
    .eq("id", true)
    .maybeSingle();
  return data != null;
}

async function getDriveClient() {
  const accessToken = await getValidDriveAccessToken();
  if (!accessToken) {
    throw new Error("구글드라이브 업로드 계정이 연결되지 않았습니다 — 관리자 페이지에서 다시 연결해 주세요.");
  }
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

/** 루트 폴더 아래 서비스별 하위 폴더를 찾고, 없으면 새로 만든다(최초 업로드 시
 * 1회만 생성, 이후로는 재사용) — "디렉토리는 서비스별로" 요구사항(2026-09-02). */
async function ensureServiceFolder(
  drive: Awaited<ReturnType<typeof getDriveClient>>,
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
  const drive = await getDriveClient();
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
    const drive = await getDriveClient();
    await drive.files.delete({ fileId });
  } catch (e) {
    console.error(`[deleteAttachmentFromDrive] 삭제 실패 (${fileId}):`, e instanceof Error ? e.message : e);
  }
}
