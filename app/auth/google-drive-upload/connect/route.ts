import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { requireAdminClient } from "@/lib/supabase/authed";
import { buildGoogleDriveUploadAuthUrl } from "@/lib/googleDriveUpload/oauth";
import { isGoogleCalendarConfigured } from "@/lib/googleCalendar/env";

// 관리자 페이지의 "구글드라이브 업로드 연결" 버튼이 여기로 온다. 회사 전체가
// 공유하는 연결 하나뿐이라(google_drive_upload_connection이 싱글턴) 아무나 다시
// 연결해 다른 계정으로 바꿔치기하지 못하게 admin만 허용한다.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  await requireAdminClient();

  if (!isGoogleCalendarConfigured) {
    return NextResponse.redirect(`${origin}/dashboard/admin?driveUploadError=not_configured`);
  }

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("google_drive_upload_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = `${origin}/auth/google-drive-upload/callback`;
  return NextResponse.redirect(buildGoogleDriveUploadAuthUrl(redirectUri, state));
}
