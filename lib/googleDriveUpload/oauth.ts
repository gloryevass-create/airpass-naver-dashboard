import "server-only";
import { googleCalendarClientId, googleCalendarClientSecret } from "@/lib/googleCalendar/env";

// 개인 Google 캘린더 연동(lib/googleCalendar/env.ts)에 이미 등록된 것과 같은
// OAuth 클라이언트(같은 Google Cloud 프로젝트)를 재사용한다 — 하나의 OAuth
// 클라이언트로 요청 시점마다 다른 scope를 물어볼 수 있어, 이 기능만을 위한
// 별도 클라이언트를 새로 등록할 필요가 없다(사용자가 Google Cloud Console에서
// 승인된 리디렉션 URI만 하나 추가하면 됨).
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// lib/googleDriveAttachments.ts가 예전에 서비스 계정으로 쓰던 것과 같은 전체
// drive scope — 업로드뿐 아니라 파일 삭제·공유 권한 부여까지 이 스코프 하나로
// 처리한다(사용자 확인 없이도 이미 서비스 계정 시절부터 이 범위로 설계돼 있었음).
const SCOPES = ["https://www.googleapis.com/auth/drive"].join(" ");

export function buildGoogleDriveUploadAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: googleCalendarClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export async function exchangeCodeForDriveTokens(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleCalendarClientId,
      client_secret: googleCalendarClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`구글 토큰 교환 실패: ${await res.text()}`);
  }
  return res.json();
}

export async function refreshDriveAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: googleCalendarClientId,
      client_secret: googleCalendarClientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`구글 토큰 갱신 실패: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.email === "string" ? data.email : null;
}
