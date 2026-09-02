import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireAdminClient } from "@/lib/supabase/authed";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCodeForDriveTokens, fetchGoogleAccountEmail } from "@/lib/googleDriveUpload/oauth";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_drive_upload_oauth_state")?.value;
  cookieStore.delete("google_drive_upload_oauth_state");

  if (oauthError || !code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/dashboard/admin?driveUploadError=1`);
  }

  const { user } = await requireAdminClient();

  try {
    const redirectUri = `${origin}/auth/google-drive-upload/callback`;
    const tokens = await exchangeCodeForDriveTokens(code, redirectUri);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/dashboard/admin?driveUploadError=no_refresh_token`);
    }

    const googleEmail = await fetchGoogleAccountEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // google_drive_upload_connection은 RLS 정책이 하나도 없어(service_role만
    // 접근 가능) 세션 클라이언트가 아니라 반드시 admin 클라이언트로 써야 한다.
    const admin = createAdminClient();
    const { error } = await admin.from("google_drive_upload_connection").upsert({
      id: true,
      google_email: googleEmail ?? "",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_token_expires_at: expiresAt,
      connected_by: user.id,
      connected_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[google-drive-upload/callback] 연결 저장 실패:", error.message);
      return NextResponse.redirect(`${origin}/dashboard/admin?driveUploadError=1`);
    }
  } catch (e) {
    console.error("[google-drive-upload/callback] 토큰 교환 실패:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${origin}/dashboard/admin?driveUploadError=1`);
  }

  return NextResponse.redirect(`${origin}/dashboard/admin?driveUploadConnected=1`);
}
