import "server-only";
import { google } from "googleapis";

export type DriveMaterialFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  iconLink: string | null;
  modifiedTime: string | null;
};

export const isGoogleDriveConfigured = Boolean(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_MATERIALS_FOLDER_ID
);

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY가 설정되지 않았습니다.");
  }
  // .env 파일에 여러 줄 PEM 키를 그대로 넣을 수 없어 \n으로 이스케이프해서 저장하므로
  // 실제 개행문자로 되돌린다(다른 서비스 키에는 없는, PEM 키 특유의 처리).
  const key = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    // 폴더 목록 조회(readonly)뿐 아니라 발송 직전 개별 파일에 "링크가 있는 모든
    // 사용자" 보기 권한을 부여해야 해서(ensureFileShared) 전체 drive 스코프가 필요하다
    // — drive.readonly로는 permissions.create가 거부된다.
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

function getMaterialsFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_MATERIALS_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_MATERIALS_FOLDER_ID가 설정되지 않았습니다.");
  return folderId;
}

/** 자료 폴더 바로 아래의 파일 목록(하위 폴더 재귀 탐색은 하지 않음 — 필요해지면 확장). */
export async function listMaterialFiles(): Promise<DriveMaterialFile[]> {
  const drive = getDriveClient();
  const folderId = getMaterialsFolderId();

  const files: DriveMaterialFile[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size, iconLink, modifiedTime)",
      orderBy: "name",
      pageSize: 200,
      pageToken,
    });
    for (const f of res.data.files ?? []) {
      if (!f.id || !f.name) continue;
      files.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType ?? "application/octet-stream",
        sizeBytes: f.size ? Number(f.size) : null,
        iconLink: f.iconLink ?? null,
        modifiedTime: f.modifiedTime ?? null,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

/** 파일에 "링크가 있는 모든 사용자는 볼 수 있음" 권한이 없으면 부여하고, 파일명과
 * 공유 가능한 열람 링크를 반환한다. 이미 그 권한이 있으면 그대로 재사용한다(중복
 * 부여 방지). 파일명은 클라이언트가 보낸 값을 신뢰하지 않고 이 시점에 다시 조회한다. */
export async function ensureFileShared(fileId: string): Promise<{ name: string; link: string }> {
  const drive = getDriveClient();

  const existing = await drive.permissions.list({
    fileId,
    fields: "permissions(id, type, role)",
  });
  const hasAnyoneReader = (existing.data.permissions ?? []).some(
    (p) => p.type === "anyone" && (p.role === "reader" || p.role === "writer")
  );

  if (!hasAnyoneReader) {
    await drive.permissions.create({
      fileId,
      requestBody: { type: "anyone", role: "reader" },
    });
  }

  const file = await drive.files.get({ fileId, fields: "name, webViewLink" });
  if (!file.data.webViewLink || !file.data.name) {
    throw new Error(`파일(${fileId})의 이름 또는 공유 링크를 가져오지 못했습니다.`);
  }
  return { name: file.data.name, link: file.data.webViewLink };
}
