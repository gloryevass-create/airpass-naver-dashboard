import "server-only";
import { googleCalendarClientId, googleCalendarClientSecret } from "./env";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// calendar.events(이벤트 보기+쓰기, 2026-08-29 확장 — 팀 일정을 개인 구글
// 캘린더에도 등록하는 기능 추가) + openid/email은 어느 구글 계정을 연결했는지
// 표시하기 위해서만 쓴다. calendar.events는 이벤트 조회까지 포함하므로 별도
// calendar.readonly는 필요 없다(범위를 최소로 유지 — 캘린더 목록·공유설정
// 등은 건드리지 않음).
const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "openid", "email"].join(" ");

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: googleCalendarClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    // access_type=offline + prompt=consent가 있어야 refresh_token을 받는다 —
    // 이미 한 번 연결한 계정이 다시 연결할 때도 매번 새 refresh_token을 받게 강제한다.
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

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
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

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
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

export async function fetchGoogleUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.email === "string" ? data.email : null;
}
